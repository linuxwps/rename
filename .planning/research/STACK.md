# Stack Research

**Domain:** macOS Native Application Development
**Researched:** 2026-05-13
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| SwiftUI | Latest (iOS 17/macOS 14+) | UI Framework | Apple's recommended framework for modern macOS apps. Provides declarative syntax, native macOS controls (NSTableView equivalent via Table, sidebar support), and automatic accessibility. SwiftUI handles platform-specific UI automatically. |
| Swift | 6.0+ | Language | Swift 6 provides complete data race safety checking, improved concurrency diagnostics, and `NonisolatedNonsendingByDefault` (Swift 6.2+). Mandatory for new projects in 2025. |
| Swift Concurrency | Built-in | Async/await, Actors | Structured concurrency using async/await, Task, and MainActor. Essential for non-blocking file operations in a batch rename tool. |
| Foundation | Built-in | File operations | URL, FileManager, FileHandle for all file system interactions. Native Swift file handling without dependencies. |
| UniformTypeIdentifiers | Built-in | File type identification | macOS-native way to identify file types (UTType). Required for fileImporter/contentType filtering. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Swift Testing | 1.0+ (Swift 6.x) | Unit testing | Primary testing framework for Swift 6 projects. Supports async tests, parameterized tests, and macro-based @Test. |
| XcodeGen | 2.40.0+ | Project generation | Generate .xcodeproj from YAML spec. Eliminates merge conflicts, supports Xcode 16.0+ project format. |
| Swift Package Manager | Built-in | Dependency management | Native package manager. Use for any third-party dependencies (minimal needed for this app). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Xcode 16.0+ | IDE & build | Required for Swift 6 and modern project format. |
| XcodeGen | CLI project generation | `xcodegen generate` from project.yml |
| swift build | CLI build | Alternative to Xcode build for CI/CD |

## Installation

```bash
# Install XcodeGen (if not using Homebrew)
brew install xcodegen

# Verify Swift version
swift --version
# Should be Swift 6.0+ (as of 2025)

# Create project structure
mkdir -p Rename/Sources Rename/Resources Rename/Tests

# Generate Xcode project
xcodegen generate
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| SwiftUI | AppKit (NSAppKit) | Only if you need deep system integration or legacy macOS APIs not available in SwiftUI. SwiftUI now covers most use cases. |
| Swift Testing | XCTest | XCTest still works and has broader ecosystem support. Switch if Swift Testing causes compatibility issues. |
| XcodeGen | Tuist | Tuist offers more advanced features but has steeper learning curve. XcodeGen is simpler for single-target apps. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| UIKit | Not native to macOS, iOS-only | SwiftUI (macOS-native) |
| Swift 5.x (pre-6) | Missing data race safety, incomplete concurrency checking | Swift 6.0+ |
| CocoaPods | Extra dependency layer, not needed for simple projects | Swift Package Manager |
| Combine (standalone) | Swift Concurrency replaces Combine for new code | Swift async/await with @MainActor |

## Stack Patterns by Variant

**If targeting macOS 12.0+ only:**
- Use SwiftUI with NavigationSplitView for sidebar layout
- Minimum Swift version: 5.9
- Use `@MainActor` for all ViewModels

**If needing legacy macOS API access:**
- Use SwiftUI with AppKit interop via NSViewRepresentable
- Wrap legacy FileManager operations in async functions
- Keep AppKit usage minimal (only when SwiftUI lacks equivalent)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Swift 6.0 | Xcode 16.0+ | Required for Swift 6 concurrency checking |
| Swift Testing 1.0 | Swift 5.9+ | Backwards compatible with Swift 5.9 |
| XcodeGen 2.40.0 | Xcode 15.0+, Swift 5.9+ | Supports projectFormat: xcode16_0 |
| SwiftUI | macOS 14.0+ ( Sonoma) | Most features; some available macOS 13.0 |

## Sources

- Context7: `/websites/developer_apple_swiftui` — SwiftUI documentation, macOS app patterns
- Context7: `/swiftlang/swift` — Swift 6 concurrency, async/await
- Context7: `/swiftlang/swift-testing` — Swift Testing framework (async tests, @Test macro)
- Context7: `/swiftlang/swift-foundation` — URL, FileManager operations
- Context7: `/yonaskolb/xcodegen` — XcodeGen configuration, project generation

---
*Stack research for: macOS Native Application Development*
*Researched: 2026-05-13*