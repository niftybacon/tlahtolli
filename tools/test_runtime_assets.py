"""Generated cache keys must change with sources, stay stable otherwise."""
from build_runtime_assets import generate

html = '<script src="./translator-engine.js"></script><script defer src="./translator-integrated.js"></script>'
files = {}
read = lambda name: files.get(name, 'fixture\n')
first = generate(html, read)
assert generate(first, read) == first
assert '?v=' in first and 'data-runtime=' in first and 'data-sentence-src=' in first
files['translator-sentence.js'] = 'changed\n'
second = generate(first, read)
assert second != first
assert second.split('data-runtime=')[1] != first.split('data-runtime=')[1]
assert generate(second, read) == second
files['translator-sentence.js'] = 'changed\r\n'
assert generate(second, read) == second, 'Windows newline conversion must not change cache keys'
files['dictionary.json'] = 'new lexical data'
assert generate(second, read) != second
try:
    generate('<html></html>', read)
except ValueError:
    pass
else:
    raise AssertionError('Missing loader must fail')
print('PASS deterministic runtime URLs, dynamic dependency/data changes and newline parity')
