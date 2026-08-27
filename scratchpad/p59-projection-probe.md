# Item E — what the ClickUp round trip and the mark-stripped projection preserve

Probed 2026-08-27T22:36:00.404Z on list `901709596688`, task `86e30jd44`, torn down below.

Body sent: 422 chars, 32 lines, 17 labelled cases.
Returned: 405 chars, 31 lines.

**Intraword underscore: PRESERVED.**

| case | class | verdict | detail |
|---|---|---|---|
| `E1a` | bare token, four intraword underscores | **PRESERVED** | the whole line is byte-identical |
| `E1b` | bare token, leading underscore | **PRESERVED** | the whole line is byte-identical |
| `E2` | the same token wrapped in backticks | **ALTERED** | sent "E2 `irs433_tp_ssn_itin`" -> got "E2 irs433_tp_ssn_itin" |
| `E3a` | single intraword underscore | **PRESERVED** | the whole line is byte-identical |
| `E3b` | underscores around a word, the emphasis case | **ALTERED** | sent "E3b _emphasised_" -> got "E3b emphasised" |
| `E3c` | two tokens, underscore-adjacent | **PRESERVED** | the whole line is byte-identical |
| `E4a` | line beginning with a hash | **ALTERED** | sent "# E4a hash-opened heading" -> got "E4a hash-opened heading" |
| `E4b` | line beginning with a hyphen | **ALTERED** | sent "- E4b hyphen-opened item" -> got "E4b hyphen-opened item" |
| `E4c` | line beginning with an ordinal | **ALTERED** | sent "1. E4c ordinal-opened item" -> got "E4c ordinal-opened item" |
| `E5` | pipe-delimited row that could be read as a table | **PRESERVED** | the whole line is byte-identical |
| `E6a` | a literal backslash | **PRESERVED** | the whole line is byte-identical |
| `E6b` | an asterisk pair around a word | **ALTERED** | sent "E6b *starred*" -> got "E6b starred" |
| `E6c` | the two-character sequence backslash-n | **PRESERVED** | the whole line is byte-identical |
| `E6d` | a literal underscore-escape sequence | **ALTERED** | sent "E6d \\_notemph\\_" -> got "E6d _notemph_" |
| `E7a` | leading spaces before text | **PRESERVED** | the whole line is byte-identical |
| `E7b` | blank line between two non-blank lines | **PRESERVED** | both non-blank lines present; blank lines between them: 1 |
| `E8` | trailing space at end of line | **ALTERED** | sent "E8 trailing space follows this " -> got "E8 trailing space follows this" |

## Sent vs returned, per case

### `E1a` — bare token, four intraword underscores

```text
sent    : "E1a irs433_tp_ssn_itin"
returned: "E1a irs433_tp_ssn_itin"
```
projection (`stripMarks`) sees them as equal: **true**

### `E1b` — bare token, leading underscore

```text
sent    : "E1b _co_authored_with_hand"
returned: "E1b _co_authored_with_hand"
```
projection (`stripMarks`) sees them as equal: **true**

### `E2` — the same token wrapped in backticks

```text
sent    : "E2 `irs433_tp_ssn_itin`"
returned: "E2 irs433_tp_ssn_itin"
```
projection (`stripMarks`) sees them as equal: **true**

### `E3a` — single intraword underscore

```text
sent    : "E3a backbone_key"
returned: "E3a backbone_key"
```
projection (`stripMarks`) sees them as equal: **true**

### `E3b` — underscores around a word, the emphasis case

```text
sent    : "E3b _emphasised_"
returned: "E3b emphasised"
```
projection (`stripMarks`) sees them as equal: **false**

### `E3c` — two tokens, underscore-adjacent

```text
sent    : "E3c vlp_case_liab and irs433d_lien_determination"
returned: "E3c vlp_case_liab and irs433d_lien_determination"
```
projection (`stripMarks`) sees them as equal: **true**

### `E4a` — line beginning with a hash

```text
sent    : "# E4a hash-opened heading"
returned: "E4a hash-opened heading"
```
projection (`stripMarks`) sees them as equal: **true**

### `E4b` — line beginning with a hyphen

```text
sent    : "- E4b hyphen-opened item"
returned: "E4b hyphen-opened item"
```
projection (`stripMarks`) sees them as equal: **false**

### `E4c` — line beginning with an ordinal

```text
sent    : "1. E4c ordinal-opened item"
returned: "E4c ordinal-opened item"
```
projection (`stripMarks`) sees them as equal: **false**

### `E5` — pipe-delimited row that could be read as a table

```text
sent    : "E5 alpha | beta | gamma"
returned: "E5 alpha | beta | gamma"
```
projection (`stripMarks`) sees them as equal: **true**

### `E6a` — a literal backslash

```text
sent    : "E6a a\\b"
returned: "E6a a\\b"
```
projection (`stripMarks`) sees them as equal: **true**

### `E6b` — an asterisk pair around a word

```text
sent    : "E6b *starred*"
returned: "E6b starred"
```
projection (`stripMarks`) sees them as equal: **true**

### `E6c` — the two-character sequence backslash-n

```text
sent    : "E6c x\\ny"
returned: "E6c x\\ny"
```
projection (`stripMarks`) sees them as equal: **true**

### `E6d` — a literal underscore-escape sequence

```text
sent    : "E6d \\_notemph\\_"
returned: "E6d _notemph_"
```
projection (`stripMarks`) sees them as equal: **false**

### `E7a` — leading spaces before text

```text
sent    : "E7a       six spaces precede this"
returned: "E7a       six spaces precede this"
```
projection (`stripMarks`) sees them as equal: **true**

### `E7b` — blank line between two non-blank lines

```text
sent    : "E7btop / (blank) / E7bbottom"
returned: "E7btop non-blank"
```
projection (`stripMarks`) sees them as equal: **false**

### `E8` — trailing space at end of line

```text
sent    : "E8 trailing space follows this "
returned: "E8 trailing space follows this"
```
projection (`stripMarks`) sees them as equal: **true**
