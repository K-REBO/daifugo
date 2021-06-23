enum Suit {
    Heart,
    Tile,
    Clover,
    Pike,
}
type Hand = (Suit, u8);

struct Env {
    revolution: bool,
	
}

fn check_hand(first: Hand, last: Hand, env: &Env) -> Result<bool, String> {
    // first wins to last or not

    let mut first_num = if first.1 == 1 || first.1 == 2 {
        first.1 + 13
    } else {
        first.1
    };

    let mut last_num = if last.1 == 1 || last.1 == 2 {
        last.1 + 13
    } else {
        last.1
    };

    if first_num > last_num {
        Ok(true ^ env.revolution)// XOR!
    } else if first_num < last_num {
        Ok(false ^ env.revolution)// XOR!
    } else {
        Err("Can't compare hands".to_string())
    }
}

#[test]
fn check() {
	let env = Env {
		revolution: false,
	};
    assert_eq!(
        check_hand((Suit::Clover, 1), (Suit::Clover, 3), &env),
        Ok(true)
    );
    assert_eq!(
        check_hand((Suit::Clover, 13), (Suit::Clover, 1), &env),
        Ok(false)
    );



	//after revolution
	let env = Env {
		revolution: true,
	};
	assert_eq!(
        check_hand((Suit::Clover, 13), (Suit::Clover, 1), &env),
        Ok(true)
    );

}
