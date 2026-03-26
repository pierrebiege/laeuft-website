import SwiftUI
import PhotosUI

struct ContentView: View {
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var selectedImages: [UIImage] = []
    @State private var state: AppState = .idle
    @State private var extracted: ExtractedData?
    @State private var errorMessage: String?
    @State private var saveResults: [String] = []

    enum AppState {
        case idle, extracting, review, saving, done
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 4) {
                        Image(systemName: "chart.bar.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(.purple)
                        Text("Insight Uploader")
                            .font(.title2.bold())
                        Text("Instagram Insights Screenshots hochladen")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 8)

                    switch state {
                    case .idle:
                        idleView
                    case .extracting:
                        extractingView
                    case .review:
                        reviewView
                    case .saving:
                        savingView
                    case .done:
                        doneView
                    }
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    // MARK: - Idle State

    private var idleView: some View {
        VStack(spacing: 16) {
            PhotosPicker(
                selection: $selectedItems,
                maxSelectionCount: 10,
                matching: .screenshots,
                photoLibrary: .shared()
            ) {
                VStack(spacing: 12) {
                    Image(systemName: "photo.on.rectangle.angled")
                        .font(.system(size: 44))
                        .foregroundStyle(.purple.opacity(0.7))
                    Text("Screenshots auswählen")
                        .font(.headline)
                    Text("Wähle deine Instagram Insights Screenshots")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [8]))
                        .foregroundStyle(.purple.opacity(0.3))
                )
            }
            .onChange(of: selectedItems) { _, newItems in
                Task {
                    selectedImages = []
                    for item in newItems {
                        if let data = try? await item.loadTransferable(type: Data.self),
                           let image = UIImage(data: data) {
                            selectedImages.append(image)
                        }
                    }
                }
            }

            // Image Previews
            if !selectedImages.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(0..<selectedImages.count, id: \.self) { index in
                            Image(uiImage: selectedImages[index])
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: 80, height: 80)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }

                Button(action: extract) {
                    HStack {
                        Image(systemName: "sparkles")
                        Text("\(selectedImages.count) Screenshot\(selectedImages.count > 1 ? "s" : "") analysieren")
                    }
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.purple)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            if let error = errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(.red.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }

    // MARK: - Extracting

    private var extractingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Claude analysiert die Screenshots...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("Das kann bis zu 30 Sekunden dauern")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 40)
    }

    // MARK: - Review

    private var reviewView: some View {
        VStack(spacing: 16) {
            if let data = extracted {
                // Screenshot type
                if let type = data.screenshot_type {
                    HStack {
                        Image(systemName: "doc.text.magnifyingglass")
                            .foregroundStyle(.purple)
                        Text("Typ: \(type)")
                            .font(.subheadline.bold())
                        Spacer()
                    }
                }

                // Account Metrics
                if let metrics = data.account_metrics, !metrics.isEmpty {
                    metricSection(title: "Account Metriken", icon: "person.fill", data: metrics)
                }

                // Audience
                if let audience = data.audience_data, !audience.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "person.3.fill")
                                .foregroundStyle(.blue)
                            Text("Zielgruppen-Daten")
                                .font(.subheadline.bold())
                        }
                        Text(audience.keys.joined(separator: ", "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.blue.opacity(0.05))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Posts
                if let posts = data.post_data, !posts.isEmpty {
                    HStack {
                        Image(systemName: "square.grid.2x2.fill")
                            .foregroundStyle(.orange)
                        Text("\(posts.count) Posts erkannt")
                            .font(.subheadline.bold())
                        Spacer()
                    }
                    .padding()
                    .background(.orange.opacity(0.05))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Summary
                if let summary = data.raw_text {
                    Text(summary)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(.gray.opacity(0.05))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            // Action Buttons
            HStack(spacing: 12) {
                Button(action: reset) {
                    Text("Abbrechen")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(.gray.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                Button(action: save) {
                    HStack {
                        Image(systemName: "square.and.arrow.down.fill")
                        Text("Speichern")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.green)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            .font(.headline)
        }
    }

    // MARK: - Saving

    private var savingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Speichere in Dashboard...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 40)
    }

    // MARK: - Done

    private var doneView: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(.green)

            Text("Erfolgreich gespeichert!")
                .font(.title3.bold())

            ForEach(saveResults, id: \.self) { result in
                Text(result)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Button(action: reset) {
                HStack {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Weitere Screenshots")
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding()
                .background(.purple)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.top, 8)
        }
        .padding(.vertical, 20)
    }

    // MARK: - Helper Views

    private func metricSection(title: String, icon: String, data: [String: AnyCodable]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(.purple)
                Text(title)
                    .font(.subheadline.bold())
            }
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 8) {
                ForEach(Array(data.keys.sorted()), id: \.self) { key in
                    HStack {
                        Text(key)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("\(data[key]?.value ?? "")")
                            .font(.caption.bold())
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.purple.opacity(0.05))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.purple.opacity(0.03))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Actions

    private func extract() {
        state = .extracting
        errorMessage = nil

        Task {
            do {
                let result = try await APIService.shared.extractInsights(images: selectedImages)
                await MainActor.run {
                    extracted = result
                    state = .review
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    state = .idle
                }
            }
        }
    }

    private func save() {
        guard let data = extracted else { return }
        state = .saving

        Task {
            do {
                let results = try await APIService.shared.saveExtracted(data: data)
                await MainActor.run {
                    saveResults = results
                    state = .done
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    state = .review
                }
            }
        }
    }

    private func reset() {
        selectedItems = []
        selectedImages = []
        extracted = nil
        errorMessage = nil
        saveResults = []
        state = .idle
    }
}

#Preview {
    ContentView()
}
