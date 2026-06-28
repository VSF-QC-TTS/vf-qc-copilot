package vn.vinfast.vfqc.api.service.runner;

import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisEvalJobPublisher implements EvalJobPublisher {

  private final StringRedisTemplate redisTemplate;

  @Value("${vfqc.runner.redis.stream:eval.run.requested}")
  private String streamKey;

  @Override
  public void publish(EvalRunJobMessage message) {
    Map<String, String> body = new LinkedHashMap<>();
    body.put("eventType", message.eventType());
    body.put("runId", message.runId().toString());
    body.put("internalRunId", message.internalRunId().toString());
    body.put("projectId", message.projectId().toString());
    body.put("createdAt", message.createdAt().toString());

    redisTemplate.opsForStream().add(StreamRecords.mapBacked(body).withStreamKey(streamKey));
  }
}
