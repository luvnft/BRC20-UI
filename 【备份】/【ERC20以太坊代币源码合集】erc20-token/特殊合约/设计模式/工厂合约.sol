2、工厂合约

工厂合约用于创建和部署“子”合约。

工厂用于存储子合约的地址，以便在必要时提取使用。

为什么不把它们存在Web应用数据库里？
将地址数据存在工厂合约里、存在区块链上，更加安全不会丢失。
需要跟踪所有新 创建的子合约以便同步更新数据库。
eg. 销售资产并跟踪这些资产（例如，谁是资产的所有者）。 需要向负责部署资产的 函数添加payable修饰符以便销售资产。


contract CarShop {
   address[] carAssets;
   function createChildContract(string brand, string model) public payable {
      // insert check if the sent ether is enough to cover the car asset ...
      address newCarAsset = new CarAsset(brand, model, msg.sender);            
      carAssets.push(newCarAsset);   
   }
   function getDeployedChildContracts() public view returns (address[]) {
      return carAssets;
   }
}
 
contract CarAsset {
   string public brand;
   string public model;
   address public owner;
   function CarAsset(string _brand, string _model, address _owner) public {
      brand = _brand;
      model = _model;
      owner = _owner;
   }
}   