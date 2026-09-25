import Foundation
import CoreGraphics

func emit(_ value: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: value) else { return }
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write(Data([10]))
}

var count: UInt32 = 0
guard CGGetActiveDisplayList(0, nil, &count) == .success, count > 0 else {
    emit(["type": "error", "reason": "display-unavailable"])
    exit(2)
}
guard count == 1 else {
    emit(["type": "error", "reason": "multiple-displays"])
    exit(2)
}

var display: CGDirectDisplayID = 0
guard CGGetActiveDisplayList(1, &display, &count) == .success else {
    emit(["type": "error", "reason": "display-unavailable"])
    exit(2)
}
let bounds = CGDisplayBounds(display)
guard bounds.width > 0, bounds.height > 0 else {
    emit(["type": "error", "reason": "display-unavailable"])
    exit(2)
}

guard CGRequestListenEventAccess() else {
    emit(["type": "error", "reason": "permission"])
    exit(2)
}

func clickCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    userInfo: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {
    if type == .leftMouseDown || type == .rightMouseDown {
        let point = event.location
        if bounds.contains(point) {
            emit([
                "type": "click",
                "button": type == .leftMouseDown ? "left" : "right",
                "x": (point.x - bounds.minX) / bounds.width,
                "y": (point.y - bounds.minY) / bounds.height,
                "at": Date().timeIntervalSince1970 * 1000
            ])
        }
    }
    return Unmanaged.passUnretained(event)
}

let mask = (CGEventMask(1) << CGEventType.leftMouseDown.rawValue)
    | (CGEventMask(1) << CGEventType.rightMouseDown.rawValue)
guard let tap = CGEvent.tapCreate(
    tap: .cgSessionEventTap,
    place: .headInsertEventTap,
    options: .listenOnly,
    eventsOfInterest: mask,
    callback: clickCallback,
    userInfo: nil
) else {
    emit(["type": "error", "reason": "tap-unavailable"])
    exit(2)
}
let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
CFRunLoopAddSource(CFRunLoopGetCurrent(), source, .commonModes)
CGEvent.tapEnable(tap: tap, enable: true)
emit(["type": "ready"])
CFRunLoopRun()
