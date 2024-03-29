// fn main() {
//     println!("Hello, world!");
// }
use std::env;
    fn main() {
        let name = env::args().skip(1).next();
        match name {
            Some(n) => println!("Hello {}", n),
            None => println!("Please use ./hellowolrd name.")
        }
    }