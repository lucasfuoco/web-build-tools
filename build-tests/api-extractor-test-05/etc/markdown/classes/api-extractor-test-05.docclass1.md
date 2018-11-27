<h1 id="document_name">
DocClass1 class
</h1>

<div class="markdown level0 summary"><p id="document_description">This is an example class.</p></div>

#### Syntax

```javascript
export class DocClass1
```

## Properties

### malformedEvent

This event should have been marked as readonly.

#### Declaration

```javascript
malformedEvent: SystemEvent
```

### modifiedEvent

This event is fired whenever the object is modified.

#### Declaration

```javascript
modifiedEvent: SystemEvent
```

### regularProperty

This is a regular property that happens to use the SystemEvent type.

#### Declaration

```javascript
regularProperty: SystemEvent
```

## Methods

### exampleFunction

This is an overloaded function.

#### Declaration

```javascript
exampleFunction(a: string, b: string): string;
```

#### Parameters

|  Type | Name | Description |
|  --- | --- | --- |
|  string | _a_ | the first string |
|  string | _b_ | the second string |

#### Returns

|  Type | Description |
|  --- | --- |
|  string |  |

### interestingEdgeCases

Example: "{ \\"maxItemsToShow\\": 123 }"

The regular expression used to validate the constraints is /^\[a-zA-Z0-9\\-\_\]+$/

#### Declaration

```javascript
interestingEdgeCases(): void;
```

#### Returns

|  Type | Description |
|  --- | --- |
|  void |  |

### tableExample

An example with tables:

#### Declaration

```javascript
tableExample(): void;
```

#### Returns

|  Type | Description |
|  --- | --- |
|  void |  |

#### Remarks

<table> <tr> <td>John</td> <td>Doe</td> </tr> </table>

## Remarks

These are some remarks.
