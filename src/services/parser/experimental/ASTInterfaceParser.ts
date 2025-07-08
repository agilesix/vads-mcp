import ts from 'typescript';
import type { ComponentProperty } from "../../../types";

/**
 * ASTInterfaceParser - TypeScript AST-based interface property parser
 * 
 * This experimental parser uses the TypeScript Compiler API to parse interface
 * properties with full TypeScript syntax support. It provides more robust parsing
 * than regex-based approaches and handles complex TypeScript constructs correctly.
 * 
 * ## Advantages over Regex Approach
 * 
 * - **Robust Parsing**: Handles all TypeScript syntax correctly
 * - **Built-in JSDoc**: Uses TypeScript's native JSDoc extraction
 * - **Future-proof**: Automatically supports new TypeScript features
 * - **Error Handling**: Provides proper syntax error reporting
 * - **Complex Types**: Correctly parses union types, generics, and complex structures
 * 
 * ## Bundle Size Consideration
 * 
 * Adding TypeScript compiler dependency increases bundle size by ~2-3MB.
 * This may be significant for Cloudflare Workers deployment.
 * 
 * ## Performance Characteristics
 * 
 * - AST parsing: ~5-10ms per interface (estimated)
 * - Memory overhead: Higher than string-based parsing
 * - Initialization cost: TypeScript compiler setup
 * 
 * ## Usage
 * 
 * ```typescript
 * const parser = new ASTInterfaceParser();
 * const properties = parser.parseInterfaceProperties(interfaceCode);
 * ```
 * 
 * @see InterfaceParser For the current regex-based implementation
 * @see docs/ast-parsing-evaluation.md For detailed comparison analysis
 */
export class ASTInterfaceParser {
	parseInterfaceProperties(interfaceCode: string): ComponentProperty[] {
		const properties: ComponentProperty[] = [];

		const sourceFile = ts.createSourceFile(
			'temp.ts',
			interfaceCode,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS
		);

		const visit = (node: ts.Node) => {
			if (ts.isInterfaceDeclaration(node)) {
				node.members.forEach(member => {
					if (ts.isPropertySignature(member) && member.name) {
						const name = (member.name as ts.Identifier).text;
						const type = member.type ? member.type.getText() : 'any';
						const optional = !!member.questionToken;

						const jsDoc = ts.getJSDocCommentsAndTags(member);
						const comment = jsDoc.length > 0
							? (jsDoc[0] as ts.JSDoc)?.comment?.toString() ?? undefined
							: undefined;

						properties.push({
							name,
							type,
							optional,
							description: comment,
						});
					}
				});
			}

			ts.forEachChild(node, visit);
		};

		visit(sourceFile);
		return properties;
	}
}
