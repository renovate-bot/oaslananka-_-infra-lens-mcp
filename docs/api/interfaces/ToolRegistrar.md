[**infra-lens-mcp v1.0.6**](../README.md)

***

[infra-lens-mcp](../README.md) / ToolRegistrar

# Interface: ToolRegistrar

Defined in: [server-core.ts:65](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/server-core.ts#L65)

## Methods

### registerTool()

> **registerTool**\<`Input`\>(`name`, `config`, `handler`): `void`

Defined in: [server-core.ts:66](https://github.com/oaslananka/infra-lens-mcp/blob/main/src/server-core.ts#L66)

#### Type Parameters

##### Input

`Input`

#### Parameters

##### name

`string`

##### config

[`ToolConfig`](../type-aliases/ToolConfig.md)

##### handler

[`ToolHandler`](../type-aliases/ToolHandler.md)\<`Input`\>

#### Returns

`void`
