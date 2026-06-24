[**infra-lens-mcp v1.0.6**](../README.md)

***

[infra-lens-mcp](../README.md) / MetricSnapshot

# Interface: MetricSnapshot

Defined in: [types.ts:238](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L238)

## Properties

### timestamp

> **timestamp**: `number`

Defined in: [types.ts:239](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L239)

***

### host

> **host**: `string`

Defined in: [types.ts:240](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L240)

***

### cpu

> **cpu**: `object`

Defined in: [types.ts:241](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L241)

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

Defined in: [types.ts:248](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L248)

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

Defined in: [types.ts:256](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L256)

***

### network

> **network**: [`NetworkMetric`](NetworkMetric.md)[]

Defined in: [types.ts:257](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L257)

***

### processes

> **processes**: [`ProcessMetric`](ProcessMetric.md)[]

Defined in: [types.ts:258](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L258)

***

### os

> **os**: `object`

Defined in: [types.ts:259](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L259)

#### hostname

> **hostname**: `string`

#### uptime\_seconds

> **uptime\_seconds**: `number`

#### kernel

> **kernel**: `string`

#### distro

> **distro**: `string`
