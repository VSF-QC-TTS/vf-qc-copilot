package vn.vinfast.vfqc.api.service.runner;

public interface EvalJobPublisher {

  void publish(EvalRunJobMessage message);
}
