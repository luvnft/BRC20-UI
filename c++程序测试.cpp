// GCC路径
// /usr/include/c++/11
// /usr/include/x86_64-linux-gnu/c++/11
// /usr/include/c++/11/backward
// /usr/lib/gcc/x86_64-linux-gnu/11/include
// /usr/local/include
// /usr/include/x86_64-linux-gnu
// /usr/include

// #include<stdio.h>
// int main()
// {
//     int arr[5] = {1, 2, 3, 4, 5}; // 假设这是你想要输出的数组
//     // 遍历数组并打印每个元素
//     for(int i = 0; i < 5; i++) {
//         printf("%d ", arr[i]);
//     }
//     printf("\n"); // 在数组输出完毕后换行
//     printf("Hello World From C!\n");
//     return 0;
// }

#include <iostream>
int main() {
    int arr[5] = {}; // 初始化一个大小为5的整型数组，所有元素默认初始化为0
    // 使用range-based for循环遍历数组并打印每个元素
    for(int elem : arr) {
        std::cout << elem << " ";
    }
    std::cout << std::endl; // 在所有元素打印完成后换行
    return 0;
}

// 执行C++文件
// gcc /home/wth000/gitee/BRC20-ERC20-UI/c++程序测试.cpp -o test
// ./test

// 安装g++
// sudo apt install g++

// 使用g++替换gcc
// g++ /home/wth000/gitee/BRC20-ERC20-UI/c++程序测试.cpp -o 测试
// gcc /home/wth000/gitee/BRC20-ERC20-UI/c++程序测试.cpp -lstdc++ -o 测试

// g++ /home/wth000/gitee/BRC20-ERC20-UI/c++程序测试.cpp -o test
// ./test