---
title: My Approach to Manage Passwords
layout: layouts/thought.html
extra_css: css/thoughts.css
tags: thoughts
post_date: "May 19, 2026"
---

Last month, I updated my approach to store and manage all my passwords.

In the past, all my passwords were very similar.
They all followed the same pattern.
I thought that since they were not identical,
if someone happened to know one of my passwords, the others would be safe.
However, the truth is that since I did have a pattern,
anyone who knows one of my passwords
can easily get all of them within a few trials.

I realized the problem and decided to make a change.
The goal is simple:

1. complex enough to not be cracked easily
1. random passwords that don't relate to each other
1. relatively easy to remember frequently used ones
1. fast to type
1. no third-party company has access to them
1. a flexible way to store them

## How to come up with such a password

My "technique" for choosing such passwords is kind of tricky.
I simply use the pinyin of a complete sentence that I was thinking about
when setting that particular password.
In that case, all these passwords are not related to each other and
they are complex enough to resist brute-force cracking.
Also, since the sentence is really random and contains no personal
information about myself, one cannot try to social engineer me to crack it.
The most important thing is they are extremely fast
and really easy to remember for commonly used ones, as they are just sentences.

## Where to store all passwords

Password managers provided by one's phone or browser are fine.
But I want to be cool and don't really want to store my passwords
somewhere I don't really know.

So I use this CLI tool called [`pass`](https://www.passwordstore.org/).
Basically, it saves all the encrypted passwords inside a directory
and uses the `pass` command and a passphrase to access them.
Since all the passwords are now just files locally, we can use `git`
or whatever method we want to sync between devices.
Also, because all these files are asymmetrically encrypted,
even if those password files get leaked, without the private key which
is only stored locally, they are impossible to crack.

The thing about `pass` is that it is not only safe but also lets users
control everything.
So we actually know what is happening, which makes me feel good.
