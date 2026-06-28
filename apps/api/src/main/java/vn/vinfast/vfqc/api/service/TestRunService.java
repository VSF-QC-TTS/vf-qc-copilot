package vn.vinfast.vfqc.api.service;

import java.util.List;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.testrun.request.CreateTestRunRequest;
import vn.vinfast.vfqc.api.model.testrun.response.RunEventResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestResultResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestRunResponse;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;

public interface TestRunService {

  PageResponse<TestRunResponse> list(UUID projectPublicId, int page, int size);

  TestRunResponse create(UUID projectPublicId, CreateTestRunRequest request, String email);

  TestRunResponse get(UUID runPublicId);

  PageResponse<TestResultResponse> listResults(UUID runPublicId, int page, int size);

  List<RunEventResponse> listEvents(UUID runPublicId);

  TestRunResponse cancel(UUID runPublicId);
}
