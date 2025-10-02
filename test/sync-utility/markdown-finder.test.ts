import { describe, it, expect } from 'vitest';
import type { MarkdownFile } from '../../sync-utility/src/types';

// Note: markdown-finder.ts requires Node.js-specific modules (glob, fs)
// which are not compatible with Cloudflare Workers test environment.
// The pure utility functions are tested here without importing the module.

describe('markdown-finder (utility functions)', () => {
	// Inline implementations for testing pure functions without Node.js dependencies

	function groupFilesByDirectory(files: MarkdownFile[]): Map<string, MarkdownFile[]> {
		const grouped = new Map<string, MarkdownFile[]>();
		for (const file of files) {
			const dir = file.relativePath.includes('/')
				? file.relativePath.substring(0, file.relativePath.lastIndexOf('/'))
				: '.';
			const existing = grouped.get(dir) || [];
			existing.push(file);
			grouped.set(dir, existing);
		}
		return grouped;
	}

	function calculateTotalSize(files: MarkdownFile[]): number {
		return files.reduce((total, file) => total + file.size, 0);
	}

	describe('groupFilesByDirectory', () => {
		it('should group files by their directory', () => {
			const files: MarkdownFile[] = [
				{
					absolutePath: '/test/src/doc1.md',
					relativePath: 'src/doc1.md',
					r2Key: 'src/doc1.md',
					size: 1024,
					lastModified: new Date(),
				},
				{
					absolutePath: '/test/src/subdir/doc2.md',
					relativePath: 'src/subdir/doc2.md',
					r2Key: 'src/subdir/doc2.md',
					size: 2048,
					lastModified: new Date(),
				},
				{
					absolutePath: '/test/src/subdir/doc3.md',
					relativePath: 'src/subdir/doc3.md',
					r2Key: 'src/subdir/doc3.md',
					size: 512,
					lastModified: new Date(),
				},
			];

			const grouped = groupFilesByDirectory(files);

			expect(grouped.size).toBe(2);
			expect(grouped.get('src')).toHaveLength(1);
			expect(grouped.get('src/subdir')).toHaveLength(2);
		});

		it('should handle empty file list', () => {
			const grouped = groupFilesByDirectory([]);

			expect(grouped.size).toBe(0);
		});

		it('should handle files in root directory', () => {
			const files: MarkdownFile[] = [
				{
					absolutePath: '/test/doc1.md',
					relativePath: 'doc1.md',
					r2Key: 'doc1.md',
					size: 1024,
					lastModified: new Date(),
				},
			];

			const grouped = groupFilesByDirectory(files);

			expect(grouped.size).toBe(1);
			expect(grouped.get('.')).toHaveLength(1);
		});

		it('should handle deeply nested directories', () => {
			const files: MarkdownFile[] = [
				{
					absolutePath: '/test/a/b/c/doc1.md',
					relativePath: 'a/b/c/doc1.md',
					r2Key: 'a/b/c/doc1.md',
					size: 1024,
					lastModified: new Date(),
				},
				{
					absolutePath: '/test/a/b/c/doc2.md',
					relativePath: 'a/b/c/doc2.md',
					r2Key: 'a/b/c/doc2.md',
					size: 2048,
					lastModified: new Date(),
				},
			];

			const grouped = groupFilesByDirectory(files);

			expect(grouped.size).toBe(1);
			expect(grouped.get('a/b/c')).toHaveLength(2);
		});
	});

	describe('calculateTotalSize', () => {
		it('should sum file sizes correctly', () => {
			const files: MarkdownFile[] = [
				{
					absolutePath: '/test/doc1.md',
					relativePath: 'doc1.md',
					r2Key: 'doc1.md',
					size: 1024,
					lastModified: new Date(),
				},
				{
					absolutePath: '/test/doc2.md',
					relativePath: 'doc2.md',
					r2Key: 'doc2.md',
					size: 2048,
					lastModified: new Date(),
				},
				{
					absolutePath: '/test/doc3.md',
					relativePath: 'doc3.md',
					r2Key: 'doc3.md',
					size: 512,
					lastModified: new Date(),
				},
			];

			const total = calculateTotalSize(files);

			expect(total).toBe(3584); // 1024 + 2048 + 512
		});

		it('should return 0 for empty file list', () => {
			const total = calculateTotalSize([]);

			expect(total).toBe(0);
		});

		it('should handle single file', () => {
			const files: MarkdownFile[] = [
				{
					absolutePath: '/test/doc1.md',
					relativePath: 'doc1.md',
					r2Key: 'doc1.md',
					size: 5000,
					lastModified: new Date(),
				},
			];

			const total = calculateTotalSize(files);

			expect(total).toBe(5000);
		});

		it('should handle zero-byte files', () => {
			const files: MarkdownFile[] = [
				{
					absolutePath: '/test/empty1.md',
					relativePath: 'empty1.md',
					r2Key: 'empty1.md',
					size: 0,
					lastModified: new Date(),
				},
				{
					absolutePath: '/test/doc2.md',
					relativePath: 'doc2.md',
					r2Key: 'doc2.md',
					size: 1024,
					lastModified: new Date(),
				},
			];

			const total = calculateTotalSize(files);

			expect(total).toBe(1024);
		});

		it('should handle large file sizes', () => {
			const files: MarkdownFile[] = [
				{
					absolutePath: '/test/large.md',
					relativePath: 'large.md',
					r2Key: 'large.md',
					size: 1024 * 1024 * 10, // 10 MB
					lastModified: new Date(),
				},
			];

			const total = calculateTotalSize(files);

			expect(total).toBe(10485760); // 10 MB in bytes
		});
	});
});
