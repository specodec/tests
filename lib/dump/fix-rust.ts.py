#!/usr/bin/env python3
with open('rust.ts', 'rb') as f:
    content = f.read()

# Find and replace the exact bytes:
# We have: 5c5c 5c22 (\\\" - three backslashes + quote)
# We want: 5c5c 22 (\\" - two backslashes + quote)

# Replace all occurrences of \\\" (hex: 5c5c5c22) with \\\" (hex: 5c5c22)
# But that's the same! Wait...

# Let me check what bytes we have:
print('Current bytes at position of field.name}:')
idx = content.find(b'field.name}')
if idx > 0:
    print('Before field.name}:', content[idx-10:idx+10].hex())
    print('As chars:', content[idx-10:idx+10])

# Fix: replace \\\\\" with \\\" (but in bytes!)
# In file: we have literal backslashes and quotes
# Need to replace: backslash backslash backslash quote
# with: backslash backslash quote

content_fixed = content.replace(b'\\\\\\\"', b'\\\"')

print('\\nFixed bytes:')
idx2 = content_fixed.find(b'field.name}')
if idx2 > 0:
    print('After field.name}:', content_fixed[idx2-10:idx2+10].hex())

with open('rust.ts', 'wb') as f:
    f.write(content_fixed)

print('\\nFile fixed!')
