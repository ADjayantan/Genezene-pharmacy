function safeNext(value, fallback = '/profile') {
  if (!value) return fallback;
  const v = value.trim();
  if (!v.startsWith('/')) return fallback;
  if (v.startsWith('//')) return fallback;
  if (v.startsWith('/\\')) return fallback;
  if (/[\x00-\x1f]/.test(v)) return fallback;
  return v;
}

let pass=0,fail=0;
const t=(input,expected,label)=>{const got=safeNext(input);
 const ok=got===expected; console.log(`  ${ok?'✓':'✗'} ${label.padEnd(42)} ${JSON.stringify(input)} → ${JSON.stringify(got)}`);
 ok?pass++:fail++;};

console.log('Open-redirect guard — MUST be blocked:');
t('https://evil.com','/profile','absolute URL');
t('http://evil.com','/profile','absolute http');
t('//evil.com','/profile','protocol-relative');
t('///evil.com','/profile','triple slash');
t('/\\evil.com','/profile','backslash trick');
t('javascript:alert(1)','/profile','javascript scheme');
t('data:text/html,<script>','/profile','data scheme');
t('  https://evil.com','/profile','leading whitespace + absolute');
t('/redirect\r\nSet-Cookie: x=1','/profile','CRLF header injection');
t('/path\x00.evil','/profile','null byte');
t('','/profile','empty string');
t(null,'/profile','null');
t(undefined,'/profile','undefined');

console.log('\nLegitimate paths — MUST be allowed:');
t('/profile','/profile','plain path');
t('/checkout','/checkout','checkout');
t('/upload-prescription','/upload-prescription','rx upload');
t('/products?cat=vitamins','/products?cat=vitamins','path with query');
t('/order/GZ123','/order/GZ123','nested path');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
