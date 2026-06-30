package vn.vinfast.vfqc.api.model.testrun;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompareTestRunData {
    private String promptTemplate;
    private List<CompareAiConfigEntry> configs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompareAiConfigEntry {
        private Long id;
        private String name;
        private String provider;
        private String model;
        private String apiKey;
    }
}
