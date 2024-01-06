5. 提款模式

简单来说，就是不用transfer，而是用send，因为一旦callback错误，transfer会导致异常，而send不会。


contract WithdrawalContract {
   mapping(address => uint) buyers;
   function buy() payable {
      require(msg.value > 0);
      buyers[msg.sender] = msg.value;
   }
   function withdraw() {
      uint amount = buyers[msg.sender];
      require(amount > 0);
      buyers[msg.sender] = 0;      
      require(msg.sender.send(amount));
   }
}