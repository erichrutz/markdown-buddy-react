# PlantUML Diagram Examples

This document demonstrates various PlantUML diagram types supported by MarkDown Buddy.

## Sequence Diagram

```plantuml
@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response

Alice -> Bob: Another authentication Request
Alice <-- Bob: Another authentication Response
@enduml
```

## Use Case Diagram

```puml
@startuml
:Main Admin: as Admin
(Use the application) as (Use)

User -> (Start)
User --> (Use)

Admin ---> (Use)

note right of Admin : This is an example.

note right of (Use)
  A note can also
  be on several lines
end note

note "This note is connected\nto several objects." as N2
(Start) .. N2
N2 .. (Use)
@enduml
```

## Class Diagram

```plantuml
@startuml
class Car

Driver - Car : drives >
Car *- Wheel : have 4 >
Car -- Person : < owns

class Person {
  -name: String
  -age: int
  +getName()
  +setName()
}

class Driver {
  +drive()
}
@enduml
```

## Activity Diagram

```plantuml
@startuml
start
:Read config file;
if (Config valid?) then (yes)
  :Process data;
else (no)
  :Print error message;
  stop
endif
:Generate report;
stop
@enduml
```

## Component Diagram

```plantuml
@startuml
package "Some Group" {
  HTTP - [First Component]
  [Another Component]
}

node "Other Groups" {
  FTP - [Second Component]
  [First Component] --> FTP
}

cloud {
  [Example 1]
}

database "MySql" {
  folder "This is my folder" {
    [Folder 3]
  }
  frame "Foo" {
    [Frame 4]
  }
}

[Another Component] --> [Example 1]
[Example 1] --> [Folder 3]
[Folder 3] --> [Frame 4]
@enduml
```

## State Diagram

```plantuml
@startuml
[*] --> State1
State1 --> [*]
State1 : this is a string
State1 : this is another string

State1 -> State2
State2 --> [*]
@enduml
```

## Object Diagram

```plantuml
@startuml
object firstObject
object "My Second Object" as o2

firstObject <|-- o2
@enduml
```

## Deployment Diagram

```plantuml
@startuml
node node1
node node2
node node3
node1 --> node2
node1 --> node3
@enduml
```

## Simple Syntax Example

```plantuml
Bob->Alice : hello
```

This demonstrates that PlantUML diagrams are rendered inline alongside Mermaid diagrams and regular markdown content.