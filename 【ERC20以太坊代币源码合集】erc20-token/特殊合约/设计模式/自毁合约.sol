1、自毁合约

合约自毁模式用于终止一个合约，这意味着将从区块链上永久删除这个合约。 一旦被销毁，就不可能调用合约的功能，也不会在账本中记录交易。
eg. 贷款合约，它应当在贷款还清后自动销毁；另一个案例是基于时间的拍卖合约，它应当在拍卖结束后 终止 —— 假设我们不需要在链上保存拍卖的历史记录。

在处理一个被销毁的合约时，有一些需要注意的问题：

合约销毁后，发送给该合约的交易将失败。
任何发送给被销毁合约的资金，都将永远丢失。
为避免资金损失，应当在发送资金前确保目标合约仍然存在，移除所有对已销毁合约的引用。
contract SelfDesctructionContract {
   public address owner;
   public string someValue;
   modifier ownerRestricted {
      require(owner == msg.sender);
      _;
   } 
   // constructor
   function SelfDesctructionContract() {
      owner = msg.sender;
   }
   // a simple setter function
   function setSomeValue(string value){
      someValue = value;
   } 
   // you can call it anything you want
   function destroyContract() ownerRestricted {
     suicide(owner);
   }
}