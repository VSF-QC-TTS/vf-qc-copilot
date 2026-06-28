package vn.vinfast.vfqc.api.service.runner;

import java.util.UUID;
import vn.vinfast.vfqc.api.model.runner.CancelStatusResponse;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse;
import vn.vinfast.vfqc.api.model.runner.RunnerCaseResultRequest;
import vn.vinfast.vfqc.api.model.runner.RunnerCaseStartedRequest;
import vn.vinfast.vfqc.api.model.runner.RunnerFailureRequest;

public interface InternalRunService {

  EvalRunRequestResponse getEvalRequest(UUID runPublicId);

  void markStarted(UUID runPublicId);

  void markCaseStarted(UUID runPublicId, RunnerCaseStartedRequest request);

  void saveCaseResult(UUID runPublicId, RunnerCaseResultRequest request);

  void complete(UUID runPublicId);

  void fail(UUID runPublicId, RunnerFailureRequest request);

  void cancel(UUID runPublicId);

  CancelStatusResponse getCancelStatus(UUID runPublicId);
}
