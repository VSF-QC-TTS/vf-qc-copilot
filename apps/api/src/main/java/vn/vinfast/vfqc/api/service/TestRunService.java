package vn.vinfast.vfqc.api.service;

import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import vn.vinfast.vfqc.api.model.testrun.request.AddCustomColumnRequest;
import vn.vinfast.vfqc.api.model.testrun.request.CreateTestRunRequest;
import vn.vinfast.vfqc.api.model.testrun.request.OverrideResultRequest;
import vn.vinfast.vfqc.api.model.testrun.request.SaveCustomValueRequest;
import vn.vinfast.vfqc.api.model.testrun.response.CustomColumnResponse;
import vn.vinfast.vfqc.api.model.testrun.response.RunEventResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestResultOverrideResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestResultResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestRunResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestRunJobResponse;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;

public interface TestRunService {

  PageResponse<TestRunResponse> list(UUID projectPublicId, int page, int size);

  TestRunResponse create(UUID projectPublicId, CreateTestRunRequest request, String email);

  TestRunResponse get(UUID runPublicId);

  PageResponse<TestResultResponse> listResults(UUID runPublicId, int page, int size);

  List<RunEventResponse> listEvents(UUID runPublicId);

  TestRunResponse cancel(UUID runPublicId);

  List<CustomColumnResponse> listCustomColumns(UUID runPublicId);

  CustomColumnResponse addCustomColumn(UUID runPublicId, AddCustomColumnRequest request);

  void saveCustomValue(UUID resultPublicId, SaveCustomValueRequest request);

  TestResultOverrideResponse overrideResult(UUID resultPublicId, OverrideResultRequest request, String userEmail);

  TestRunJobResponse startExport(UUID runPublicId, String email);

  TestRunJobResponse getJobEvent(UUID jobPublicId);

  ResponseEntity<byte[]> downloadExcel(UUID runPublicId, UUID jobPublicId);
}
