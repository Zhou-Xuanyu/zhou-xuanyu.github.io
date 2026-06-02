---
title: "To publish npm package: markdown-it-pangu-pro"
layout: layouts/thought.html
extra_css: css/thoughts.css
tags: thoughts
post_date: "May 31, 2026"
---

## Beginning of the Story

When I was working on this website last week.
I noticed that the spacing between CJK characters and Latin looks
too close and unbalanced.
It immediately reminded me of a concept that I had heard about: pangu spacing.
It basically means that there needs to be spacing of 0.25em width
between any CJK and Latin. 
However, before this incident, I had only known this concept but
never cared about it or worried about it,
as nowadays, most input methods and operating systems automatically handle
this. 
However, as I am making my personal website I have to solve it myself. 

## Naive Attempt

At first, I was silly enough to try to solve this problem
by manually inserting a half-width space between CJK and Latin in every single
markdown.
However, it turned out to be impossible. 
The first problem: I have never had this habit before,
so I hardly ever remembered to add the space at all.
Another problem is that when inputting Chinese, the space actually defaults
to full-width, which is around 0.5em.

Those two problems are, in fact, possible to solve.
But the real problem is that the spacing actually varies in width from
font to font and weight to weight,
which means that it is only technically around 0.25em and can fluctuate.

In that case, we can never solve the problem ideally
with manual or auto spacing method.

## Journey to My Solution

Then I consulted with Claude. 
As the markdown to html conversion is handled by 
[markdown-it](https://github.com/markdown-it/markdown-it),
we came up with this plan to detect the CJK-Latin pattern and 
insert a `span` element with a fixed width of 0.25em in between.
We use `core.ruler.push` to access the raw token tree
at the final stage of markdown-it conversion and insert a
function to do the edit.

```javascript
md.core.ruler.push("cjk_spacing", cjkSpacing);
```

LLM explanation for markdown-it data flow:

> markdown-it processes a document in stages. It first parses the source
> into a stream of *block* tokens (paragraphs, headings, lists, code
> fences); each block that contains inline content is then re-parsed
> into a child stream of *inline* tokens (text, emphasis, links, code
> spans); finally the whole token tree is rendered to HTML.
>
> Between parsing and rendering, there is a third rule chain called
> *core*. Core rules run over the fully-parsed token tree — both block
> and inline — and can mutate it before rendering. Built-in core rules
> include things like smart-quote replacement and the `typographer`
> pass. `core.ruler.push("cjk_spacing", cjkSpacing)` appends our rule
> to the end of that chain, so by the time `cjkSpacing` runs, every
> text token already has its final content and we only need to walk
> the tree, find CJK ↔ Latin transitions inside text tokens, and
> splice in our `<span>` token.

To check the full code, see my 
[github repo](https://github.com/Zhou-Xuanyu/markdown-it-pangu-pro).

I basically had zero experience with JavaScript before.
With this opportunity, I learned a few interesting facts about it.

### Built-in and Powerful Support for Regex
This time we need to detect CJK-Latin or Latin-CJK pattern.
And this is definitely not a simple pattern to constrain.
However, with regex it is simple.

```javascript
const CJK = '一-鿿㐀-䶿豈-﫿぀-ゟ゠-ヿ';
const LATIN = 'A-Za-z0-9';
const pattern = new RegExp(`([${CJK}]) ?([${LATIN}])|([${LATIN}]) ?([${CJK}])`, "g");
```

With js's built-in regex object, we can simply do something like above.
And then we can run the search by

```javascript
let match = pattern.exec(child.content)
```

and match will be an array whose `[0]` is the whole pattern,
and `[1,2,3,4]` will be each captured pattern within `()`.
Also `match.index` will be the position of match.
What's more impressive is that we also have `pattern.lastIndex` access
which we can use to manually set the starting position of next iteration.
In our particular use case, we can do something like this to prevent
skipping "中文hello中文" where the second match is also first match of next
CJK and Latin combination.

```javascript
const secondChar = match[2] || match[4];
// some code
lastIndex = match.index + match[0].length - secondChar.length;
pattern.lastIndex = lastIndex;
```

### Arrow function

In JavaScript we can define an inline anonymous function with `=>`.
Basically we can do

```javascript
const add = (a, b) => a + b
```

to quickly define a function inline.
In our use case, we frequently need to insert a processing function
into markdown-it's routine.
Because of this feature, we can `md.core.ruler.push` a function
inline without naming that function.

Since this function is very likely not being reused,
it is actually quite a convenient way of defining a function.
However, I don't really like coding this way.
I always prefer to make code as readable as possible,
so I still define the function with an explicit name.
In that way, we can also `push` all the edits we want to make together,
and define those actual functions later, which makes the code cleaner.
Here is a sample snippet from my `.eleventy.js`, which is the tool
I use to generate this website.
I will talk more about
[eleventy](https://www.11ty.dev/)
later, after some more refinement to this website.

```javascript
eleventyConfig.addTransform("resolve-relative-paths", resolveRelativePaths);
eleventyConfig.addTransform("rewrite-md-hrefs", rewriteMdHrefs);
eleventyConfig.addCollection("thoughts", sortThoughts);
eleventyConfig.addCollection("noise", sortNoise);

// helper functions declared later
// ...
```

By the way, the anonymous feature is not provided by arrow functions.
With the `function` syntax we can also define one anonymously.
But it is definitely fancier to use the arrow.

### Miscellaneous
Another interesting fact is that for some historical reason,
JavaScript has two popular import systems:
[ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
and
[CommonJS](https://nodejs.org/api/modules.html).

## npm Package

After coming up with this complete solution and making sure that it was working,
I thought it is actually a common need for anyone writing technical
articles with pure markdown and a simple text editor.
So I thought I could probably make it into a 
[markdown-it](https://github.com/markdown-it/markdown-it)
plugin. 
It was also quite a new experience for me.
I was pretty sure that a `markdown-it` plugin is generally just an npm package,
as I had tried some of them. So I probably needed to publish it to npm.
But I didn't know what the process was.

It turned out to be simple and straightforward.
I only needed an npm account and to publish through the CLI with `npm publish`.
The only problem was that two-factor verification was somehow not working
on my device, so I ended up generating a 7-day access token to log in to the CLI.

And here is a link to my 
[npm package](https://www.npmjs.com/package/markdown-it-pangu-pro).
