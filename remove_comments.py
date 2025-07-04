import re
import sys

# Read the file
with open('src/main.js', 'r', encoding='utf-8') as file:
    content = file.read()

# Remove all single-line comments
content = re.sub(r'//.*', '', content)

# Remove empty lines created from removing comments
content = re.sub(r'^\s*\n', '', content, flags=re.MULTILINE)

# Write the file back
with open('src/main.js', 'w', encoding='utf-8') as file:
    file.write(content)

print("All comments have been removed from main.js")
