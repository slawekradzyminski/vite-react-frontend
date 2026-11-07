import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const srcRoot = join(__dirname, '..');

// Interactive elements that automated tests locate by data-testid.
const INTERACTIVE_TAGS = new Set(['a', 'button', 'input', 'select', 'textarea', 'form', 'Button', 'Input', 'Textarea', 'Link', 'NavLink']);
const ANNOUNCED_ROLES = new Set(['alert', 'status']);

function componentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return componentFiles(path);
    return path.endsWith('.tsx') && !path.includes('.test.') ? [path] : [];
  });
}

function stringAttribute(attribute: ts.JsxAttribute) {
  const initializer = attribute.initializer;
  return initializer && ts.isStringLiteral(initializer) ? initializer.text : undefined;
}

function findMissingTestIds(fileName: string, code: string) {
  const source = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const missing: string[] = [];

  const visit = (node: ts.Node, parentIsAsChild: boolean) => {
    let childrenInheritProps = false;
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = opening.tagName.getText(source);
      const properties = opening.attributes.properties;
      const attributes = properties.filter(ts.isJsxAttribute);
      const names = attributes.map((attribute) => attribute.name.getText(source));
      const role = attributes.find((attribute) => attribute.name.getText(source) === 'role');
      const roleValue = role ? stringAttribute(role) : undefined;
      const needsTestId = INTERACTIVE_TAGS.has(tag) || (roleValue !== undefined && ANNOUNCED_ROLES.has(roleValue));
      // Spread props forward a caller's data-testid; asChild merges the parent's attributes into its child.
      const forwardsProps = properties.some(ts.isJsxSpreadAttribute);
      childrenInheritProps = names.includes('asChild');

      if (needsTestId && !forwardsProps && !parentIsAsChild && !childrenInheritProps && !names.includes('data-testid')) {
        const { line } = source.getLineAndCharacterOfPosition(opening.getStart(source));
        missing.push(`${fileName}:${line + 1} <${tag}>`);
      }
    }
    if (ts.isJsxElement(node)) {
      node.children.forEach((child) => visit(child, childrenInheritProps));
    } else {
      ts.forEachChild(node, (child) => visit(child, false));
    }
  };

  visit(source, false);
  return missing;
}

describe('data-testid coverage', () => {
  it('gives every interactive or announced element a data-testid', () => {
    const missing = componentFiles(srcRoot).flatMap((file) =>
      findMissingTestIds(relative(srcRoot, file), readFileSync(file, 'utf8')),
    );

    expect(missing).toEqual([]);
  });

  it('reports elements without a data-testid and skips forwarded ones', () => {
    const missing = findMissingTestIds('sample.tsx', `
      export const Sample = () => (
        <form data-testid="sample-form">
          <button type="submit">Save</button>
          <p role="alert">Failed</p>
          <p role={role}>Dynamic</p>
          <Button asChild data-testid="sample-link"><Link to="/">Home</Link></Button>
          <Input {...props} />
          <a href="/docs">Docs</a>
        </form>
      );
    `);

    expect(missing).toEqual(['sample.tsx:4 <button>', 'sample.tsx:5 <p>', 'sample.tsx:9 <a>']);
  });
});
