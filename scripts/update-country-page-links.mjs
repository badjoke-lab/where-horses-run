import fs from 'node:fs';

const file = 'src/components/CountryDetailPage.astro';
let text = fs.readFileSync(file, 'utf8');
text = text.replace(
  "const racecoursePathPrefix = isJa ? '/ja/racecourses/' : '/racecourses/';",
  "const racecoursePathPrefix = isJa ? '/ja/tracks/' : '/tracks/';"
);
text = text.replace(
  "const countriesBackPath = isJa ? '/ja/countries/' : '/countries/';",
  "const countriesBackPath = isJa ? '/ja/countries/' : '/countries/';\nconst canonicalPath = isJa ? `/ja/countries/${country.slug}/` : `/countries/${country.slug}/`;\nconst alternatePath = isJa ? `/countries/${country.slug}/` : `/ja/countries/${country.slug}/`;"
);
text = text.replace(
  '<BaseLayout title={pageTitle} description={pageDescription} lang={locale}>',
  '<BaseLayout title={pageTitle} description={pageDescription} lang={locale} canonicalPath={canonicalPath} alternatePath={alternatePath}>'
);
text = text.replaceAll('<th>', '<th scope="col">');
fs.writeFileSync(file, text);
