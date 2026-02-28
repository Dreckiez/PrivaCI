const email_regex = "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";
const credit_card_regex = "\\b(?:(?:4\\d{3}|5[1-5]\\d{2}|6011|7\\d{3})-?\\d{4}-?\\d{4}-?\\d{4}|3[47]\\d{13})\\b";

export const BASE_TOML = `
    title = "PrivaCI PII & Custom Rules"

    [allowlist]
    description = "Global Allowlist to prevent false positives"
    paths = [
        '''^\\.idea/.*''',
        '''^\\.vscode/.*''',
        '''^node_modules/.*''',
        '''.*\\.svg$''',
        '''.*\\.png$''',
        '''.*\\.jpg$''',
        '''.*\\.jpeg$''',
        '''.*\\.pdf$''',
        '''.*\\.mp4$'''
    ]

    [[rules]]
    id = "generic-api-key"
    description = "Generic API Key or Secret"
    regex = '''(?i)(?:api[_-]?key|secret|token|password)[\\s:=]+["'][a-zA-Z0-9\\-_]{16,64}["']'''
    tags = ["KEY", "CRITICAL"]

    [[rules]]
    id = "pii-email"
    description = "Email Address"
    regex = '''(?i)${email_regex}'''
    tags = ["PII", "WARNING"]

    [[rules]]
    id = "pii-ssn"
    description = "Social Security Number"
    regex = '''\\b\\d{3}-\\d{2}-\\d{4}\\b'''
    tags = ["PII", "CRITICAL"]

    [[rules]]
    id = "pii-credit-card"
    description = "Credit Card Number"
    regex = '''(?i)${credit_card_regex}'''
    tags = ["PII", "CRITICAL"]
`;