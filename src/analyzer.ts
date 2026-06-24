import * as ss from 'simple-statistics';

import { getBaseline } from './baseline.js';
import {
  DEFAULT_THRESHOLDS,
  type AnalysisThresholds,
  type Anomaly,
  type MetricSnapshot,
  type ProcessMetric
} from './types.js';

function selectTopCpuProcess(processes: ProcessMetric[]): ProcessMetric | undefined {
  return [...processes].sort((left, right) => right.cpu_percent - left.cpu_percent)[0];
}

function selectTopMemoryProcess(processes: ProcessMetric[]): ProcessMetric | undefined {
  return [...processes].sort((left, right) => right.mem_percent - left.mem_percent)[0];
}

export function analyzeSnapshot(
  snapshot: MetricSnapshot,
  baselineLabel = 'default',
  thresholds: AnalysisThresholds = DEFAULT_THRESHOLDS
): {
  anomalies: Anomaly[];
  summary: string;
  health_score: number;
} {
  const baseline = getBaseline(snapshot.host, baselineLabel);
  const anomalies: Anomaly[] = [];
  const system = snapshot.system ?? { failed_units: 0, kernel_error_events: 0 };
  const memoryHighPercent =
    thresholds.memory_warn_percent +
    (thresholds.memory_critical_percent - thresholds.memory_warn_percent) / 2;
  const loadHighRatio =
    thresholds.load_warn_ratio + (thresholds.load_critical_ratio - thresholds.load_warn_ratio) / 3;

  if (baseline?.cpu_samples && baseline.cpu_samples.length >= 5) {
    const mean = ss.mean(baseline.cpu_samples);
    const stdDeviation = ss.standardDeviation(baseline.cpu_samples);
    const zScore =
      stdDeviation > 0
        ? (snapshot.cpu.usage_percent - mean) / stdDeviation
        : snapshot.cpu.usage_percent >= mean + 20
          ? 3
          : 0;

    if (
      Math.abs(zScore) > thresholds.zscore_threshold ||
      snapshot.cpu.usage_percent > thresholds.cpu_warn_percent
    ) {
      const topProcess = selectTopCpuProcess(snapshot.processes);
      anomalies.push({
        metric: 'cpu',
        severity:
          snapshot.cpu.usage_percent >= thresholds.cpu_critical_percent
            ? 'critical'
            : snapshot.cpu.usage_percent > thresholds.cpu_warn_percent
              ? 'high'
              : 'medium',
        value: snapshot.cpu.usage_percent,
        baseline_mean: Number(mean.toFixed(1)),
        z_score: Number(zScore.toFixed(1)),
        explanation: `CPU is at ${snapshot.cpu.usage_percent}% (${zScore.toFixed(
          1
        )}σ above baseline ${mean.toFixed(1)}%). Load is ${snapshot.cpu.load_1}/${snapshot.cpu.load_5}/${snapshot.cpu.load_15}. Top CPU consumer: ${topProcess?.command ?? 'unknown'} (${topProcess?.cpu_percent ?? 0}%).`,
        recommendation:
          snapshot.cpu.usage_percent > 90
            ? `Investigate ${topProcess?.command ?? 'the top process'} (PID ${topProcess?.pid ?? 0}) and review application logs or scale-out options.`
            : `Monitor ${topProcess?.command ?? 'the active workload'} and confirm whether this spike matches an expected traffic pattern.`
      });
    }
  } else if (snapshot.cpu.usage_percent > thresholds.cpu_warn_percent) {
    const topProcess = selectTopCpuProcess(snapshot.processes);
    anomalies.push({
      metric: 'cpu',
      severity: snapshot.cpu.usage_percent >= thresholds.cpu_critical_percent ? 'critical' : 'high',
      value: snapshot.cpu.usage_percent,
      baseline_mean: 0,
      explanation: `CPU is at ${snapshot.cpu.usage_percent}% with no baseline yet. Top process: ${topProcess?.command ?? 'unknown'}.`,
      recommendation:
        'Record more baseline samples with record_baseline before relying on z-score anomaly detection.'
    });
  }

  if (snapshot.memory.usage_percent > thresholds.memory_warn_percent) {
    const topMemoryProcess = selectTopMemoryProcess(snapshot.processes);
    anomalies.push({
      metric: 'memory',
      severity:
        snapshot.memory.usage_percent > thresholds.memory_critical_percent
          ? 'critical'
          : snapshot.memory.usage_percent > memoryHighPercent
            ? 'high'
            : 'medium',
      value: snapshot.memory.usage_percent,
      baseline_mean: baseline?.memory_mean ?? 0,
      explanation: `Memory usage is ${snapshot.memory.usage_percent}% (${snapshot.memory.used_mb}MB/${snapshot.memory.total_mb}MB). Swap usage is ${snapshot.memory.swap_used_mb}MB. Top memory consumer: ${topMemoryProcess?.command ?? 'unknown'} (${topMemoryProcess?.mem_percent ?? 0}%).`,
      recommendation:
        snapshot.memory.usage_percent > 95
          ? `OOM risk is high. Restart or scale ${topMemoryProcess?.command ?? 'the affected service'} immediately.`
          : `Check ${topMemoryProcess?.command ?? 'the active process'} for leaks or oversized heap settings.`
    });
  }

  for (const disk of snapshot.disk) {
    const storageUsage = Math.max(disk.usage_percent, disk.inode_usage_percent ?? 0);
    const pressureKind =
      disk.inode_usage_percent !== undefined && disk.inode_usage_percent > disk.usage_percent
        ? 'inode'
        : 'space';
    if (storageUsage > thresholds.disk_warn_percent) {
      anomalies.push({
        metric: `${pressureKind === 'inode' ? 'disk_inode' : 'disk'}:${disk.mount}`,
        severity:
          storageUsage >= thresholds.disk_critical_percent
            ? 'critical'
            : disk.usage_percent >=
                thresholds.disk_warn_percent +
                  (thresholds.disk_critical_percent - thresholds.disk_warn_percent) / 2
              ? 'high'
              : 'medium',
        value: storageUsage,
        baseline_mean: 0,
        explanation:
          pressureKind === 'inode'
            ? `Disk ${disk.mount} inode usage is ${disk.inode_usage_percent}% (${disk.inode_used ?? 0}/${disk.inode_total ?? 0} inodes). Space usage is ${disk.usage_percent}%.`
            : `Disk ${disk.mount} is ${disk.usage_percent}% full (${disk.used_gb}GB/${disk.total_gb}GB).`,
        recommendation:
          pressureKind === 'inode'
            ? `Find directories with many small files on ${disk.mount} and clean cache, temp, or spool files before inode exhaustion blocks writes.`
            : storageUsage > 90
              ? `Run du -sh ${disk.mount}/* | sort -rh | head -20 and clean logs or temporary files on ${disk.mount}.`
              : `Plan capacity cleanup soon before ${disk.mount} becomes critical.`
      });
    }
  }

  for (const network of snapshot.network) {
    const errorCount =
      (network.rx_errors ?? 0) +
      (network.tx_errors ?? 0) +
      (network.rx_dropped ?? 0) +
      (network.tx_dropped ?? 0);
    if (errorCount > 0) {
      anomalies.push({
        metric: `network:${network.interface}`,
        severity: errorCount >= 100 ? 'high' : errorCount >= 10 ? 'medium' : 'low',
        value: errorCount,
        baseline_mean: 0,
        explanation: `Interface ${network.interface} reports ${errorCount} packet errors or drops. RX/TX bytes are ${network.rx_bytes}/${network.tx_bytes}.`,
        recommendation:
          errorCount >= 100
            ? 'Inspect NIC, driver, MTU, duplex, and upstream switch counters immediately.'
            : 'Watch the interface counters and compare them with application latency or packet loss symptoms.'
      });
    }
  }

  if (system.failed_units > 0) {
    anomalies.push({
      metric: 'system:failed_units',
      severity: system.failed_units >= 3 ? 'high' : 'medium',
      value: system.failed_units,
      baseline_mean: 0,
      explanation: `${system.failed_units} systemd unit${system.failed_units === 1 ? '' : 's'} are failed.`,
      recommendation:
        'Run systemctl --failed and inspect the affected unit logs before restarting services.'
    });
  }

  if (system.kernel_error_events > 0) {
    anomalies.push({
      metric: 'system:kernel_errors',
      severity: system.kernel_error_events >= 5 ? 'high' : 'medium',
      value: system.kernel_error_events,
      baseline_mean: 0,
      explanation: `${system.kernel_error_events} recent kernel error event${system.kernel_error_events === 1 ? '' : 's'} were found.`,
      recommendation:
        'Review dmesg for storage, network, OOM, or hardware errors that explain the symptom.'
    });
  }

  const normalizedLoad =
    snapshot.cpu.core_count > 0 ? snapshot.cpu.load_1 / snapshot.cpu.core_count : 0;
  if (normalizedLoad > thresholds.load_warn_ratio) {
    anomalies.push({
      metric: 'load',
      severity:
        normalizedLoad > thresholds.load_critical_ratio
          ? 'critical'
          : normalizedLoad > loadHighRatio
            ? 'high'
            : 'medium',
      value: snapshot.cpu.load_1,
      baseline_mean: baseline?.load_mean ?? snapshot.cpu.core_count,
      normalized_load_per_core: Number(normalizedLoad.toFixed(1)),
      explanation: `Load average is ${snapshot.cpu.load_1} on ${snapshot.cpu.core_count} cores (${Math.round(
        normalizedLoad * 100
      )}% of core capacity). Trend is ${snapshot.cpu.load_1} -> ${snapshot.cpu.load_5} -> ${snapshot.cpu.load_15}.`,
      recommendation:
        normalizedLoad > 2
          ? 'System load is above sustainable capacity. Check CPU saturation, runnable queue depth, and horizontal scaling options.'
          : 'Monitor the load trend and confirm whether the queue drains after the current burst.'
    });
  }

  const health_score = Math.max(
    0,
    100 -
      anomalies.filter((anomaly) => anomaly.severity === 'critical').length * 40 -
      anomalies.filter((anomaly) => anomaly.severity === 'high').length * 20 -
      anomalies.filter((anomaly) => anomaly.severity === 'medium').length * 10 -
      anomalies.filter((anomaly) => anomaly.severity === 'low').length * 5
  );

  const summary =
    anomalies.length === 0
      ? `Server ${snapshot.host} looks healthy. CPU is ${snapshot.cpu.usage_percent}%, memory is ${snapshot.memory.usage_percent}%, disk usage is within expected thresholds, and system health signals are quiet.`
      : `Found ${anomalies.length} anomaly${anomalies.length === 1 ? '' : 'ies'} on ${snapshot.host}. Most urgent signal: ${anomalies[0]?.explanation ?? 'n/a'}`;

  return { anomalies, summary, health_score };
}
