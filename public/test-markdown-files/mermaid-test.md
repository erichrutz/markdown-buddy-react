# Test Mermaid Diagrams

## Simple Graph
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Success]
    B -->|No| D[Failure]
```

## Sequence Diagram
```mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!
    Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?
```

## Flowchart
```mermaid
flowchart LR
    A[Hard edge] -->B(Round edge)
    B --> C{Decision}
    C -->|One| D[Result one]
    C -->|Two| E[Result two]
```