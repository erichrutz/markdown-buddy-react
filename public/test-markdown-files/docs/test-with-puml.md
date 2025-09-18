# Test Document with PlantUML Diagrams

This is a test document that contains both regular markdown content and PlantUML diagrams to verify the integration works correctly.

## Introduction

PlantUML is a powerful tool for creating UML diagrams from plain text descriptions. Let's test some basic diagrams.

## Simple Sequence Diagram

Here's a simple sequence diagram:

```plantuml
@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response
@enduml
```

## Class Diagram

Testing a basic class diagram:

```puml
@startuml
class User {
  -id: String
  -name: String
  -email: String
  +login()
  +logout()
}

class Admin {
  +manageUsers()
  +systemSettings()
}

User <|-- Admin
@enduml
```

## Simple Activity Flow

```plantuml
@startuml
start
:User opens app;
if (User logged in?) then (yes)
  :Show dashboard;
else (no)
  :Show login screen;
  :User enters credentials;
  if (Valid credentials?) then (yes)
    :Login successful;
    :Show dashboard;
  else (no)
    :Show error message;
    stop
  endif
endif
:User interacts with app;
stop
@enduml
```

## Very Simple Diagram

```puml
Bob->Alice : hello
```

## Mixed Content

This document shows that PlantUML diagrams work alongside regular markdown content like:

- **Bold text**
- *Italic text*
- `Code snippets`
- [Links](https://example.com)

### Code Block (Non-PlantUML)

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

### Another PlantUML Diagram

```plantuml
@startuml
participant User
participant "Web Browser" as Browser
participant "Web Server" as Server
participant Database

User -> Browser: Enter URL
Browser -> Server: HTTP Request
Server -> Database: Query Data
Database --> Server: Return Data
Server --> Browser: HTTP Response
Browser --> User: Display Page
@enduml
```

## Conclusion

This test file demonstrates that PlantUML diagrams are properly rendered within markdown documents alongside other content types.