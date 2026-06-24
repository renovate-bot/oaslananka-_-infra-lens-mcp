[**infra-lens-mcp v1.0.6**](../README.md)

***

[infra-lens-mcp](../README.md) / MetricSnapshot

# Interface: MetricSnapshot

Defined in: [types.ts:290](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L290)

## Properties

### timestamp

> **timestamp**: `number`

Defined in: [types.ts:291](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L291)

***

### host

> **host**: `string`

Defined in: [types.ts:292](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L292)

***

### cpu

> **cpu**: `object`

Defined in: [types.ts:293](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L293)

#### usage\_percent

> **usage\_percent**: `number`

#### load\_1

> **load\_1**: `number`

#### load\_5

> **load\_5**: `number`

#### load\_15

> **load\_15**: `number`

#### core\_count

> **core\_count**: `number`

***

### memory

> **memory**: `object`

Defined in: [types.ts:300](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L300)

#### total\_mb

> **total\_mb**: `number`

#### used\_mb

> **used\_mb**: `number`

#### free\_mb

> **free\_mb**: `number`

#### usage\_percent

> **usage\_percent**: `number`

#### swap\_used\_mb

> **swap\_used\_mb**: `number`

#### swap\_total\_mb

> **swap\_total\_mb**: `number`

***

### disk

> **disk**: [`DiskMetric`](DiskMetric.md)[]

Defined in: [types.ts:308](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L308)

***

### network

> **network**: [`NetworkMetric`](NetworkMetric.md)[]

Defined in: [types.ts:309](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L309)

***

### system

> **system**: [`SystemMetric`](SystemMetric.md)

Defined in: [types.ts:310](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L310)

***

### processes

> **processes**: [`ProcessMetric`](ProcessMetric.md)[]

Defined in: [types.ts:311](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L311)

***

### os

> **os**: `object`

Defined in: [types.ts:312](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L312)

#### hostname

> **hostname**: `string`

#### uptime\_seconds

> **uptime\_seconds**: `number`

#### kernel

> **kernel**: `string`

#### distro

> **distro**: `string`

***

### warnings

> **warnings**: `string`[]

Defined in: [types.ts:318](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L318)
