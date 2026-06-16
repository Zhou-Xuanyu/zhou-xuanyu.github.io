---
title: 踹开你的手机
layout: layouts/thought.html
extra_css: css/thoughts.css
tags: thoughts
post_date: "June 14, 2026"
---

有些人啊，要是发生了微信，电话都联系不上的情况，
估计开了免扰或者单纯的铃声小然后睡的和死猪一样。
没错我也是有些人其中之一。

然后我就想，有什么办法可以越过尽可能多的限制，强制提醒到人。
就像在南京的上学的时候，再怎么睡也逃不过有些礼貌同学来踹我家房门。

最先想到的是苹果的Find My。
如果登陆的是同一个人苹果账户，可以在设备上播放铃声。
设计的初衷是用来找手机用的，确实很方便。
但是放在刚才提到的场景中就很难有实际作用，
因为必须要要是同一个账号，或者至少在同一个家庭中共享。

然后又想到的就是在美国的时候，其实经常会收到Critical Alert（龙卷风很多）。
手机会开始强制报警，让我们躲到地下室去，甚至就发生过在上课的时候
全班的iPhone一起报警的时候。
这就说明苹果是有强制提醒的接口，
那么应该可以开发一个软件通过这个API来踹开你朋友的手机。

研究了一下，IOS应用想要获取这种权限是需要像苹果申请的这样写起来就有麻烦。
如果不上架App Store倒是可以，但是必须要侧载，朋友之间用起来也不是很方便。
再加上侧载必须要要用Xcode，现在真的非常避免使用集成开发环境，
主要还是因为用的都是丐版笔记本，存储空间实在有限，动不动就十几个G的空间占用，
很难不介意啊。

不过进一步研究，好的是已经有人做过这件事了。
是一个叫
[bark](https://github.com/Finb/Bark)
的开源项目，还是中国人写的。
稍微玩了一下，相当成熟了，这里可以简单讲一下它的逻辑。

给苹果手机发送消息其实很简单，只需要向APNS服务器发送请求。
`bark-server`就是做这件事的工具，然后`bark`就是对应的在用户手机上接受请求的工具。
然后呢，想要提醒别人的用户需要远程控制这个`bark-server`去发送这个请求，
方式也很简单，通过https协议，传入参数就可以控制。
因为是https，用任何的浏览器都可以发送，所以确实非常方便。

基本流程就是这样，除此以外为了安全还有一些限制，比如用户只会收到
手动配置的服务器发送的消息，而且服务器发送的时候也必须要拿到用户特定的token。
总体来说整个项目做的非常高效精简。

可能唯一的问题就是在默认模式下用的`bark-server`是作者自己的，
虽然这是一件好事，但同时也意味着如果直接用的话作者是可以看到每一条消息请求的。
所以特别在意隐私，或者像我这样单纯好奇的，就可以使用作者开源的后端去自己host。

大概就是这样，今天把自己的后端搭建好了测试了一下。
相当的好用。不过我用的是美国的服务器，如果想要用我的服务器来发送提醒是要开代理的，
但是接收并不需要，因为走的苹果的APNS，理论上走的是苹果的内网到国内然后推送的。

非常小而美的软件，真正的小而美。

> **Fact-checked by Claude (June 14, 2026)**
>
> **WEA ≠ iOS Critical Alerts.** The tornado/emergency alerts received in the US classroom are delivered via **Wireless Emergency Alerts (WEA)** — a cell broadcast standard sent directly by carriers over radio, with no involvement from Apple, APNS, or the internet. iOS **Critical Alerts** is a separate, unrelated API that allows apps to bypass Do Not Disturb with Apple's approval, and it is what Bark actually uses. The observation (all iPhones alarming at once) is correct, but it demonstrates WEA, not Critical Alerts.
>
> **Sideloading doesn't require Xcode specifically.** Tools like AltStore and Sideloadly also sideload IPA files without Xcode. Xcode is one option, not a prerequisite.
