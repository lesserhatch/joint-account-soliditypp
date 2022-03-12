
# Factory Pattern Fail
My design used an array of accounts all within a single contract. This design
does not meet the specifications that the account is payable without significant
overhead maintaining which accounts had received which tokens and how many.

I decided to abstract out the create functionality of my existing JointAccount
into a new JointAccountFactory contract. JointAccountFactory would create and
track JointAccount contracts. Each JointAccount would have its own funds pool
without the overhead from before.

This did not work. JointAccountFactory.create appeared to execute successfully,
but actually reverts. The solpp debugger shows this as status "1, Execution reverted"
and mocha tests fail on the query:

    test JointAccount
  Sign and send deploy transaction
  Wait for confirming deploy request. OK
  Wait for receiving deploy request OK
  Contract deployed!
  Wait for receiving call request. OK
  Query failed, try again.
  Query failed, try again.
  Query failed, try again.
  Query failed, try again.
  Query failed, try again.
  ^C

I searched Vite's documentation but found nothing about factory contract patterns.
Then I searched Vite's discord and found a conversation between J20 and Charles Liu
from just a few days ago:

Now I think I will be working on creating a JointAccountManager contract that each
JointAccount registers with.
