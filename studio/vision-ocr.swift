import Foundation
import Vision

guard CommandLine.arguments.count >= 2 else {
    fputs("Usage: vision-ocr image-file [fr|en|es]\n", stderr)
    exit(2)
}

do {
    let url = URL(fileURLWithPath: CommandLine.arguments[1])
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    let locale = CommandLine.arguments.count >= 3 ? CommandLine.arguments[2] : "fr"
    let preferred: [String: [String]] = [
        "fr": ["fr-FR", "en-US", "es-ES"],
        "en": ["en-US", "fr-FR", "es-ES"],
        "es": ["es-ES", "en-US", "fr-FR"]
    ]
    guard let languages = preferred[locale] else {
        fputs("Unsupported OCR locale\n", stderr)
        exit(2)
    }
    let supported = try request.supportedRecognitionLanguages()
    let selected = languages.filter { supported.contains($0) }
    if !selected.isEmpty { request.recognitionLanguages = selected }
    request.automaticallyDetectsLanguage = true
    let handler = VNImageRequestHandler(url: url, options: [:])
    try handler.perform([request])
    let observations = (request.results ?? []).compactMap { observation -> [String: Any]? in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        let rect = observation.boundingBox
        return [
            "text": candidate.string,
            "confidence": Double(candidate.confidence),
            "x": Double(rect.origin.x),
            "y": Double(rect.origin.y),
            "width": Double(rect.width),
            "height": Double(rect.height)
        ]
    }
    let data = try JSONSerialization.data(withJSONObject: observations)
    FileHandle.standardOutput.write(data)
} catch {
    fputs("Vision OCR failed: \(error)\n", stderr)
    exit(1)
}
