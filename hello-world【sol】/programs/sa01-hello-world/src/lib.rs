use anchor_lang::prelude::*;

declare_id!("3GPCdFLptyRD2mXZoTFWbLwhk2ckTtfbMoJJnXnQv5Ct");

#[program]
pub mod sa01_hello_world {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
