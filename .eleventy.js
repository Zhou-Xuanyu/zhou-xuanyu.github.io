import path from "path";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItPanguPro from "markdown-it-pangu-pro";
import hljs from "highlight.js";

export default function(eleventyConfig) {
    // copy these directories to _site as-is
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/fonts");
    eleventyConfig.addPassthroughCopy("src/images");
    eleventyConfig.addPassthroughCopy("src/js");

    // markdown-it: syntax highlighting (highlight.js), anchor IDs, pangu spacing
    const md = markdownIt({ html: true, typographer: true, highlight })
        .use(markdownItAnchor, { slugify })
        .use(markdownItPanguPro);
    eleventyConfig.setLibrary("md", md);

    // transforms applied to rendered .md output
    eleventyConfig.addTransform("resolve-relative-paths", resolveRelativePaths);
    eleventyConfig.addTransform("rewrite-md-hrefs", rewriteMdHrefs);

    // override default tag-based ordering with custom sorts
    eleventyConfig.addCollection("thoughts", sortThoughts);
    eleventyConfig.addCollection("noise", sortNoise);

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
        },
    };
};

// --- helpers ---

function highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
}

// lowercase, strip special chars, spaces to hyphens;
// falls back to percent-encoding for pure CJK headings
function slugify(s) {
    return s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")
        || encodeURIComponent(s.trim());
}

// ../images/photo.jpg -> /images/photo.jpg
function resolveRelativePaths(content) {
    const inputPath = this.inputPath || this.page?.inputPath;

    if (inputPath && inputPath.endsWith(".md")) {
        const inputDir = path.dirname(inputPath);

        function normalizePath(attribute, originalPath) {
            if (originalPath.startsWith("..")) {
                const rootedPath = path.normalize(path.join(inputDir, originalPath));
                const normalPath = rootedPath.replace(/^src\//, "");
                return `${attribute}="/${normalPath}"`;
            } else {
                return `${attribute}="${originalPath}"`;
            }
        }

        const generalHrefSrc = new RegExp(`(href|src)="([^"]+)"`, "g");
        return content.replace(generalHrefSrc,
            (_, attribute, originalPath) => normalizePath(attribute, originalPath));
    } else {
        return content;
    }
}

// /thoughts/post.md -> /thoughts/post/
function rewriteMdHrefs(content) {
    const inputPath = this.inputPath || this.page?.inputPath;

    if (inputPath && inputPath.endsWith(".md")) {
        const hrefWithMd = new RegExp(`href="([^"]+\\.md)"`, "g");
        return content.replace(hrefWithMd,
            (_, absolutePath) => `href="${absolutePath.replace(/\.md$/, "/")}"`);
    } else {
        return content;
    }
}

// sort thoughts by post_date, newest first
function sortThoughts(collectionApi) {
    const thoughts = collectionApi.getFilteredByTag("thoughts");
    return thoughts.sort((a, b) =>
        new Date(b.data.post_date) - new Date(a.data.post_date)
    );
}

// sort noise by filename (2026-05.md, 2026-06.md, ...), newest first
function sortNoise(collectionApi) {
    const noise = collectionApi.getFilteredByTag("noise");
    return noise.sort((a, b) =>
        b.inputPath.localeCompare(a.inputPath)
    );
}
