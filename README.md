# Unbanked Bitcoin ATM Engine v0.0.1

I was inspired by [this article](http://bitcoinism.liberty.me/2014/07/29/how-and-why-to-build-an-unbanked-bitcoin-atm/),
which describes a self-sustaining, bi-directional Bitcoin ATM which never needs to be emptied, and which is not dependent on 
other Bitcoin exchanges to determine the price. In Panama, where I live and have been trading Bitcoin for the last 3 years, 
I have discovered that the greatest pain point is in getting USD to and from the major exchanges. Banks don't want to deal 
with Bitcoin traders, and I have burned through multiple accounts at multiple banks over the years.

This UBA concept would solve that problem, if I could figure out the right algorithm.  The article didn't propose one, and
my research showed that nobody else had attempted it, so I took a crack at it -- and failed. I couldn't come up with an
engine that wouldn't eventually run out of Bitcoin.

That was last year.  In hind sight, I think I know the issue.  As the article described, there is a fixed amount of fiat that
a machine like this could handle. That was simple. But there is no limit to how much Bitcoin the machine can handle, which
made price discovery a complex mess, doomed to failure. But my logic was flawed. There IS a limit to how much Bitcoin any 
machine can hold... ALL of it.  Armed with that revelation, I'm confident I could eventually find the right algorithm, but
I no longer have the time. I'm open sourcing my early attempts at this in the hopes that someone else can pick up where I left
off.

I also apologize for the shoddy code. This was as much an attempt to teach myself Javascript and Node.JS as it was to solve
this problem and develop the first working UBA. That said, the code is fairly well documented and easy to follow. It implements
a simple REST API that allows the developer to experiment with different seed amounts, and to make simulated trades when the price
hits something "acceptable". I won't bother to document the API here since it's so simple. I used the excellent 
[POSTman](http://www.getpostman.com/) Chrome App to interract with it, but you can use whatever makes sense to you to generate
the POST requests.

Please feel free to fork this project, to make suggestions and pull requests. I've got enough time to at least review them and 
merge them if you folks think there's justification in maintaining this repository as the gold copy.
