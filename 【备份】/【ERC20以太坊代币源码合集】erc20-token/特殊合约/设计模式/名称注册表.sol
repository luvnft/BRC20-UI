3、名称注册表

其实就是一个字符串map一个struct对象。
使用场景： 假设一个合约依赖很多个合约，如果将所有这些合约的地址写在你的应用代码中，如果这些合约的地址随着时间的推移而变化，那该怎么办？
contract NameRegistry {
   struct ContractDetails {
      address owner;
      address contractAddress;
      uint16 version;
   }
   mapping(string => ContractDetails) registry;
   function registerName(string name, address addr, uint16 ver) returns (bool) {
      // versions should start from 1
      require(ver >= 1);
      
      ContractDetails memory info = registry[name];
      require(info.owner == msg.sender);
      // create info if it doesn't exist in the registry
       if (info.contractAddress == address(0)) {
          info = ContractDetails({
             owner: msg.sender,
             contractAddress: addr,
             version: ver
          });
       } else {
          info.version = ver;
          info.contractAddress = addr;
       }
       // update record in the registry
       registry[name] = info;
       return true;
   }

    function getContractDetails(string name) constant returns(address, uint16) {
      return (registry[name].contractAddress, registry[name].version);
   }
}