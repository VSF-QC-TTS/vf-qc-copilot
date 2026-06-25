package vn.vinfast.vfqc.api.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.vinfast.vfqc.api.model.targetconfig.request.ParsedCurlCommand;
import vn.vinfast.vfqc.api.service.CurlParser;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * Tokenizer-based cURL parser that follows POSIX shell quoting rules.
 * Handles single quotes, double quotes, backslash escaping, and multi-line
 * curl commands reliably — unlike the previous regex-based approach.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Slf4j
@Component
public class CurlParserImpl implements CurlParser {

  @Override
  public ParsedCurlCommand parse(String curlString) {
    if (curlString == null || curlString.isBlank()) {
      throw ResourceException.of(ErrorCode.INVALID_CURL, "cURL string must not be empty");
    }

    // Normalize line continuations: remove trailing backslash + newline
    String normalized = curlString.replaceAll("\\\\\\s*\\n", " ").trim();

    if (!normalized.startsWith("curl")) {
      throw ResourceException.of(ErrorCode.INVALID_CURL, "String must start with 'curl'");
    }

    List<String> tokens = tokenize(normalized);
    return parseTokens(tokens);
  }

  /**
   * Tokenizes a shell command string following POSIX quoting rules.
   * <ul>
   *   <li>Single quotes: everything inside is literal (no escaping)</li>
   *   <li>Double quotes: backslash escapes work for \, ", $, `</li>
   *   <li>Outside quotes: backslash escapes the next character</li>
   *   <li>Adjacent quoted/unquoted segments are concatenated into one token</li>
   * </ul>
   */
  private List<String> tokenize(String input) {
    List<String> tokens = new ArrayList<>();
    StringBuilder current = new StringBuilder();
    boolean inSingleQuote = false;
    boolean inDoubleQuote = false;

    for (int i = 0; i < input.length(); i++) {
      char c = input.charAt(i);

      if (inSingleQuote) {
        if (c == '\'') {
          inSingleQuote = false;
        } else {
          current.append(c);
        }
      } else if (inDoubleQuote) {
        if (c == '"') {
          inDoubleQuote = false;
        } else if (c == '\\' && i + 1 < input.length()) {
          char next = input.charAt(i + 1);
          if (next == '"' || next == '\\' || next == '$' || next == '`') {
            current.append(next);
            i++;
          } else {
            current.append(c);
          }
        } else {
          current.append(c);
        }
      } else {
        if (c == '\'') {
          inSingleQuote = true;
        } else if (c == '"') {
          inDoubleQuote = true;
        } else if (c == '\\' && i + 1 < input.length()) {
          current.append(input.charAt(i + 1));
          i++;
        } else if (Character.isWhitespace(c)) {
          if (!current.isEmpty()) {
            tokens.add(current.toString());
            current.setLength(0);
          }
        } else {
          current.append(c);
        }
      }
    }

    if (!current.isEmpty()) {
      tokens.add(current.toString());
    }

    return tokens;
  }

  /**
   * Parses tokenized curl arguments into a structured command.
   */
  private ParsedCurlCommand parseTokens(List<String> tokens) {
    String method = null;
    String url = null;
    Map<String, String> headers = new HashMap<>();
    Map<String, String> queryParams = new HashMap<>();
    String body = null;

    for (int i = 0; i < tokens.size(); i++) {
      String token = tokens.get(i);

      switch (token) {
        case "curl" -> { /* skip */ }

        case "-X", "--request" -> {
          if (i + 1 < tokens.size()) {
            method = tokens.get(++i).toUpperCase();
          }
        }

        case "-H", "--header" -> {
          if (i + 1 < tokens.size()) {
            String headerStr = tokens.get(++i);
            int colonIdx = headerStr.indexOf(':');
            if (colonIdx > 0) {
              String key = headerStr.substring(0, colonIdx).trim();
              String value = headerStr.substring(colonIdx + 1).trim();
              headers.put(key, value);
            }
          }
        }

        case "-d", "--data", "--data-raw", "--data-binary", "--data-urlencode" -> {
          if (i + 1 < tokens.size()) {
            body = tokens.get(++i);
          }
        }

        case "--connect-timeout", "--max-time" -> {
          if (i + 1 < tokens.size()) i++; // skip value
        }

        default -> {
          // Skip flags we don't care about (-s, -k, -L, --compressed, etc.)
          if (token.startsWith("-")) {
            // Some flags take a value (e.g. -u user:pass, -o file)
            if (token.matches("-[uoAebc]") && i + 1 < tokens.size()) {
              i++; // skip value
            }
          } else if (url == null && token.startsWith("http")) {
            url = token;
          }
        }
      }
    }

    if (url == null) {
      throw ResourceException.of(ErrorCode.INVALID_CURL, "Missing valid URL");
    }

    // Extract query params from URL
    if (url.contains("?")) {
      String[] parts = url.split("\\?", 2);
      url = parts[0];
      for (String param : parts[1].split("&")) {
        String[] kv = param.split("=", 2);
        queryParams.put(kv[0], kv.length == 2 ? kv[1] : "");
      }
    }

    // Infer method
    if (method == null) {
      method = (body != null && !body.isBlank()) ? "POST" : "GET";
    }

    return new ParsedCurlCommand(method, url, headers, queryParams, body);
  }
}
