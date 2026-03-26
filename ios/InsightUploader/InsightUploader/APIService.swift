import Foundation
import UIKit

struct ExtractResponse: Codable {
    let success: Bool?
    let extracted: ExtractedData?
    let error: String?
    let raw_response: String?
}

struct ExtractedData: Codable {
    let screenshot_type: String?
    let period: String?
    let date_extracted: String?
    let account_metrics: [String: AnyCodable]?
    let audience_data: [String: AnyCodable]?
    let post_data: [AnyCodable]?
    let reach_data: [AnyCodable]?
    let raw_text: String?
}

struct SaveResponse: Codable {
    let success: Bool?
    let results: [String]?
    let error: String?
}

// Helper to handle dynamic JSON
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let int = value as? Int {
            try container.encode(int)
        } else if let double = value as? Double {
            try container.encode(double)
        } else if let string = value as? String {
            try container.encode(string)
        } else if let bool = value as? Bool {
            try container.encode(bool)
        } else {
            try container.encodeNil()
        }
    }
}

class APIService {
    static let shared = APIService()

    private func makeRequest(path: String, method: String, body: Any?) async throws -> Data {
        guard let url = URL(string: "\(Config.apiBaseURL)\(path)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Config.apiKey, forHTTPHeaderField: "x-api-key")
        request.timeoutInterval = 120 // Claude can take a while

        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if httpResponse.statusCode >= 400 {
            let errorBody = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError(httpResponse.statusCode, errorBody)
        }

        return data
    }

    func extractInsights(images: [UIImage]) async throws -> ExtractedData {
        var imagePayloads: [[String: String]] = []

        for image in images {
            guard let jpegData = image.jpegData(compressionQuality: 0.8) else { continue }
            let base64 = jpegData.base64EncodedString()
            imagePayloads.append([
                "data": base64,
                "media_type": "image/jpeg"
            ])
        }

        let body: [String: Any] = ["images": imagePayloads]
        let data = try await makeRequest(path: "/api/instagram/extract", method: "POST", body: body)
        let response = try JSONDecoder().decode(ExtractResponse.self, from: data)

        guard let extracted = response.extracted else {
            throw APIError.extractionFailed(response.error ?? "Keine Daten erkannt")
        }

        return extracted
    }

    func saveExtracted(data: ExtractedData) async throws -> [String] {
        // Re-encode the extracted data as a dictionary
        let encoded = try JSONEncoder().encode(data)
        let dict = try JSONSerialization.jsonObject(with: encoded) as? [String: Any] ?? [:]

        let body: [String: Any] = ["extracted": dict]
        let responseData = try await makeRequest(path: "/api/instagram/extract", method: "PUT", body: body)
        let response = try JSONDecoder().decode(SaveResponse.self, from: responseData)

        if let error = response.error {
            throw APIError.saveFailed(error)
        }

        return response.results ?? ["Gespeichert"]
    }
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(Int, String)
    case extractionFailed(String)
    case saveFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Ungültige URL"
        case .invalidResponse: return "Ungültige Antwort"
        case .serverError(let code, let msg): return "Server-Fehler \(code): \(msg)"
        case .extractionFailed(let msg): return "Extraktion fehlgeschlagen: \(msg)"
        case .saveFailed(let msg): return "Speichern fehlgeschlagen: \(msg)"
        }
    }
}
