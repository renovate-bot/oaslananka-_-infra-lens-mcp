[**infra-lens-mcp v1.0.6**](../README.md)

***

[infra-lens-mcp](../README.md) / MetricSnapshot

# Interface: MetricSnapshot

Defined in: [types.ts:261](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L261)

## Properties

### timestamp

> **timestamp**: `number`

Defined in: [types.ts:262](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L262)

***

### host

> **host**: `string`

Defined in: [types.ts:263](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L263)

***

### cpu

> **cpu**: `object`

Defined in: [types.ts:264](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L264)

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

Defined in: [types.ts:271](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L271)

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

Defined in: [types.ts:279](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L279)

***

### network

> **network**: [`NetworkMetric`](NetworkMetric.md)[]

Defined in: [types.ts:280](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L280)

***

### processes

> **processes**: [`ProcessMetric`](ProcessMetric.md)[]

Defined in: [types.ts:281](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L281)

***

### os

> **os**: `object`

Defined in: [types.ts:282](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L282)

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

Defined in: [types.ts:288](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/types.ts#L288)
