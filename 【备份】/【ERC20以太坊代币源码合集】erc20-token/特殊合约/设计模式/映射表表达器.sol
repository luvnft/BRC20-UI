4、映射表迭代器

由于mapping迭代效率低，所以需要一个mapping迭代模式，答案就是通过一个数组来保存key。

注意：put()函数的一个常见错误“通过遍历来检查指定的键是否存在”。

contract MappingIterator {
   mapping(string => address) elements;
   string[] keys;

   function put(string key, address addr) returns (bool) {
      bool exists = elements[key] == address(0)
      if (!exists) {
         keys.push(key);
      }
      elements[key] = addr;
      return true;
    }

    function getKeyCount() constant returns (uint) {
       return keys.length;
    }

    function getElementAtIndex(uint index) returns (address) {
       return elements[keys[index]];
    }

    function getElement(string name) returns (address) {
       return elements[name];
    }
}