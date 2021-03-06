function Battle() {
  this.battle = false;
  this.playerBattle = {
    health: player.health,
    mana: player.mana,
    profession: player.profession,
    strength: player.strength,
    toughness: player.toughness,
    skills: [...player.skills]
  };
  this.bossBattle = { ...axe };
  this.boss = { ...axe };
  this.selectRandomBoss = function() {
    let randomBoss = __.random(0, bosses.length - 1);
    this.bossBattle = { ...bosses[randomBoss] };
    this.boss = { ...bosses[randomBoss] };
    this.displayBoss();
  };
  this.selectProfession = function(professionImgObj) {
    let { professionname: professionName } = professionImgObj.dataset;
    professionImgObj.classList.add('onSelect');
    player.changeProfession(eval(professionName));
    this.playerBattle = { ...eval(professionName) };
    this.displayAllHealthMana();
  };
  this.regeneratePlayerMana = function() {
    if (this.playerBattle.mana > player.mana) {
      this.playerBattle.mana = player.mana;
    } else {
      this.playerBattle.mana += player.mana / 100;
    }
  };
  this.startFight = async function() {
    this.battle = true;
    this.resetBattle();
    await delay(2000);
    // this.displayAllHealthMana();
    while (this.playerBattle.health > 0 && this.bossBattle.health > 0) {
      this.bossAttack();
      this.regeneratePlayerMana();
      await delay(4000);
    }
    this.displayBattleResult();
    this.battle = false;
  };
  this.playerAttack = function(event, skillImgObj) {
    event.stopPropagation();
    if (!this.battle) {
      return;
    }
    let { skillname: skillNameToFind } = skillImgObj.dataset;
    let { health, mana, strength, toughness, skills } = this.playerBattle;
    let skillObj = __.find(skills, { name: skillNameToFind });
    let { name: skillName, indexPower, type, cooldown, manaCost, duration, skillCooldown } = skillObj;

    switch (type) {
      case 'damage':
        let damage;
        if (mana >= manaCost) {
          if (skillName === 'basic attack') {
            damage = round(this.calculateDamage(strength / 2, indexPower / 2, 0, 0));
            this.bossBattle.health -= damage;
          } else {
            damage = round(this.calculateDamage(strength, indexPower, this.bossBattle.toughness, this.boss.health));
            this.bossBattle.health -= damage;
          }
          this.playerBattle.mana -= manaCost;
          this.displayPlayerMoves(player.playerName, skillName, null, null, null, type, null, damage, manaCost);
          this.addCoolDownEffect(skillImgObj, cooldown);
        }
        break;
      case 'toughness':
        if (mana >= manaCost) {
          let increasedToughness = round(indexPower * toughness);
          this.playerBattle.toughness += increasedToughness;
          this.playerBattle.mana -= manaCost;
          this.displayPlayerMoves(player.playerName, skillName, null, increasedToughness, null, type, duration, null, manaCost);
          setTimeout(() => {
            this.displayPlayerBuffEnds(skillName);
            this.playerBattle.toughness = player.toughness;
          }, duration * 1000);
          this.addCoolDownEffect(skillImgObj, cooldown);
        }
        break;
      case 'strength':
        if (mana >= manaCost) {
          let increasedStrength = round(indexPower * strength);
          this.playerBattle.strength += increasedStrength;
          this.playerBattle.mana -= manaCost;
          this.displayPlayerMoves(player.playerName, skillName, increasedStrength, null, null, type, duration, null, manaCost);
          setTimeout(() => {
            this.displayPlayerBuffEnds(skillName);
            this.playerBattle.strength = player.strength;
          }, duration * 1000);
          this.addCoolDownEffect(skillImgObj, cooldown);
        }
        break;
      case 'health':
        if (mana >= manaCost) {
          let increasedHealth = round(indexPower * (player.health / 100));
          this.playerBattle.health += increasedHealth;
          if (this.playerBattle.health > player.health) {
            this.playerBattle.health = player.health;
          }
          this.playerBattle.mana -= manaCost;
          this.displayPlayerMoves(player.playerName, skillName, null, null, increasedHealth, type, null, null, manaCost);
          this.addCoolDownEffect(skillImgObj, cooldown);
        }
        break;
    }
    // change the DOM, so that the skill images looks differently when the skill is in cooldown

    this.displayAllHealthMana();
  };
  this.addCoolDownEffect = function(skillImgObj, cooldown) {
    skillImgObj.removeEventListener('click', handleSkillClick);
    skillImgObj.classList.add('onCoolDown');
    setTimeout(() => {
      skillImgObj.addEventListener('click', handleSkillClick);
      skillImgObj.classList.remove('onCoolDown');
    }, cooldown * 1000);
  };
  this.calculateDamage = function(attackerStrength, attackerIndexPower, targetToughness, targetHealth) {
    let damage = attackerStrength * attackerIndexPower * 10 - (targetHealth / 100) * targetToughness;
    return damage < 0 ? 0 : damage;
  };
  this.applyBossSkill = async function(bossName, skillName, strength, toughness, health, indexPower, type, duration) {
    switch (type) {
      case 'damage':
        let damage;
        if (skillName === 'basic attack') {
          damage = round(this.calculateDamage(strength / 2, indexPower / 2, 0, 0));
          this.playerBattle.health -= damage;
        } else {
          damage = round(this.calculateDamage(strength, indexPower, this.playerBattle.toughness, player.health));
          this.playerBattle.health -= damage;
        }
        this.displayBossMoves(bossName, skillName, null, null, null, type, null, damage);
        break;
      case 'toughness':
        let increasedToughness = round(indexPower * toughness);
        this.bossBattle.toughness += increasedToughness;
        this.bossBattle.toughness = this.boss.toughness;
        this.displayBossMoves(bossName, skillName, null, increasedToughness, null, type, duration, null);
        await delay(duration * 1000);
        this.displayBossBuffEnds(skillName);
        break;
      case 'strength':
        let increasedStrength = round(indexPower * strength);
        this.bossBattle.strength += increasedStrength;
        this.bossBattle.strength = this.boss.strength;
        this.displayBossMoves(bossName, skillName, increasedStrength, null, null, type, duration, null);
        await delay(duration * 1000);
        this.displayBossBuffEnds(skillName);
        break;
      case 'health':
        let increasedHealth = round(indexPower * (this.boss.health / 100));
        this.bossBattle.health += increasedHealth;
        if (this.bossBattle.health > this.boss.health) {
          this.bossBattle.health = this.boss.health;
        }
        this.displayBossMoves(bossName, skillName, null, null, increasedHealth, type, null, null);
        break;
    }
  };
  this.bossAttack = function() {
    let randomChance = createRandomChance();
    let { name: bossName, strength, toughness, health, skills } = this.bossBattle;
    let [skill1, skill2, skill3] = skills;
    if (randomChance <= skill1.chance && randomChance >= 1) {
      let { name: skillName, indexPower, type, duration } = skill1;
      this.applyBossSkill(bossName, skillName, strength, toughness, health, indexPower, type, duration);
    } else if (randomChance <= skill1.chance + skill2.chance) {
      let { name: skillName, indexPower, type, duration } = skill2;
      this.applyBossSkill(bossName, skillName, strength, toughness, health, indexPower, type, duration);
    } else if (randomChance <= skill1.chance + skill2.chance + skill3.chance) {
      let { name: skillName, indexPower, type, duration } = skill3;
      this.applyBossSkill(bossName, skillName, strength, toughness, health, indexPower, type, duration);
    } else {
      // the rest chance is a basic attack
      let { name: skillName, type, indexPower, duration } = basicBossAttack;
      this.applyBossSkill(bossName, skillName, strength, toughness, health, indexPower, type, duration);
    }
    this.displayAllHealthMana();
  };
  this.checkDeath = function() {
    if (this.playerBattle.health < 0) {
      this.playerBattle.health = 0;
    }
    if (this.bossBattle.health < 0) {
      this.bossBattle.health = 0;
    }
  };
  this.displayAllHealthMana = function() {
    let bossHealthBarElement = document.getElementsByClassName('bossHealthBarText')[0];
    let playerHealthBarElement = document.getElementsByClassName('playerHealthBarText')[0];
    let playerManaBarElement = document.getElementsByClassName('playerManaBarText')[0];
    this.checkDeath();
    bossHealthBarElement.innerText = `${this.boss.name} health ${this.bossBattle.health} / ${this.boss.health}`;
    playerHealthBarElement.innerText = `${player.playerName} health ${this.playerBattle.health} / ${player.health}`;
    playerManaBarElement.innerText = `${player.playerName} mana ${this.playerBattle.mana} / ${player.mana}`;
  };
  this.displayBoss = function() {
    let bossImageElement = document.getElementsByClassName('bossImage')[0];
    let bossName = removeSpace(this.boss.name);
    const bossImagePath = `images/bossesimg/${bossName}.png`;
    bossImageElement.src = bossImagePath;
    this.displayAllHealthMana();
  };
  this.displayBoss();
  this.displayAllHealthMana();

  this.displayBossMoves = function(bossName, skillName, increasedStrength, increasedToughness, increasedHealth, type, duration, damage) {
    let bossMovesContainerElement = document.querySelector('.bossMoves');
    switch (type) {
      case 'damage':
        bossMovesContainerElement.innerHTML += `<p>${bossName} attack using ${skillName} dealing ${damage} damage</p>`;
        break;
      case 'toughness':
        bossMovesContainerElement.innerHTML += `<p>${bossName} apply ${skillName} increase toughness by ${increasedToughness} for ${duration} seconds</p>`;
        break;
      case 'strength':
        bossMovesContainerElement.innerHTML += `<p>${bossName} apply ${skillName} increase strength by ${increasedStrength} for ${duration} seconds</p>`;
        break;
      case 'health':
        bossMovesContainerElement.innerHTML += `<p>${bossName} apply ${skillName} increase health by ${increasedHealth}</p>`;
        break;
    }
  };
  this.displayPlayerMoves = function(playerName, skillName, increasedStrength, increasedToughness, increasedHealth, type, duration, damage, manaCost) {
    let playerMovesContainerElement = document.querySelector('.playerMoves');
    switch (type) {
      case 'damage':
        playerMovesContainerElement.innerHTML += `<p>${playerName} uses ${manaCost} mana to attack using ${skillName} dealing ${damage} damage</p>`;
        break;
      case 'toughness':
        playerMovesContainerElement.innerHTML += `<p>${playerName} uses ${manaCost} mana to apply ${skillName} increase toughness by ${increasedToughness} for ${duration} seconds</p>`;
        break;
      case 'strength':
        playerMovesContainerElement.innerHTML += `<p>${playerName} uses ${manaCost} mana to apply ${skillName} increase strength by ${increasedStrength} for ${duration} seconds</p>`;
        break;
      case 'health':
        playerMovesContainerElement.innerHTML += `<p>${playerName} uses ${manaCost} mana to apply ${skillName} increase health by ${increasedHealth}</p>`;
        break;
    }
  };
  this.resetBattle = function() {
    let playerMovesContainerElement = document.querySelector('.playerMoves');
    let bossMovesContainerElement = document.querySelector('.bossMoves');
    let resultTextWrapperElement = document.querySelector('.resultTextWrapper');
    resultTextWrapperElement.innerHTML = '';
    playerMovesContainerElement.innerHTML = '';
    bossMovesContainerElement.innerHTML = '';
    this.playerBattle = { ...eval(player.profession) };
    this.bossBattle = { ...this.boss };

    // bad practices / implementation
    addSkillImageToDOM();
    addSkillEventListenerToDOM();
  };
  this.displayPlayerBuffEnds = function(buffName) {
    let playerMovesContainerElement = document.querySelector('.playerMoves');
    playerMovesContainerElement.innerHTML += `<p>Player buff ${buffName} has ends</p>`;
  };
  this.displayBossBuffEnds = function(buffName) {
    let bossMovesContainerElement = document.querySelector('.bossMoves');
    bossMovesContainerElement.innerHTML += `<p>Boss buff ${buffName} has ends</p>`;
  };
  this.bossDefeatedReward = function() {
    let { dropProfessionsRate } = this.boss;
    let resultTextWrapperElement = document.querySelector('.resultTextWrapper');
    let randomChance = createRandomChance();
    if (randomChance >= 1 && randomChance < dropProfessionsRate.elementalist) {
      let isProfessionUnlocked = player.addProfession(elementalist);
      if (isProfessionUnlocked) {
        resultTextWrapperElement.innerHTML += `<p>The boss drops is elementalist profession, but you have already unlocked this profession</p>`;
      } else {
        resultTextWrapperElement.innerHTML += `<p>You have unlocked elementalist profession</p>`;
      }
    } else if (randomChance < dropProfessionsRate.guardian + dropProfessionsRate.elementalist) {
      let isProfessionUnlocked = player.addProfession(guardian);
      if (isProfessionUnlocked) {
        resultTextWrapperElement.innerHTML += `<p>The boss drops is guardian profession, but you have already unlocked this profession</p>`;
      } else {
        resultTextWrapperElement.innerHTML += `<p>You have unlocked guardian profession</p>`;
      }
    } else if (randomChance < dropProfessionsRate.necromancer + dropProfessionsRate.guardian + dropProfessionsRate.elementalist) {
      let isProfessionUnlocked = player.addProfession(necromancer);
      if (isProfessionUnlocked) {
        resultTextWrapperElement.innerHTML += `<p>The boss drops is necromancer profession, but you have already unlocked this profession</p>`;
      } else {
        resultTextWrapperElement.innerHTML += `<p>You have unlocked necromancer profession</p>`;
      }
    } else {
      // do nothing
      resultTextWrapperElement.innerHTML += `<p>No profession drops in this battle</p>`;
    }
  };

  this.displayBattleResult = function() {
    let resultTextWrapperElement = document.querySelector('.resultTextWrapper');
    if (this.playerBattle.health > this.bossBattle.health) {
      resultTextWrapperElement.innerHTML += `<p>Player, ${player.playerName} beats boss, ${this.bossBattle.name}</p>`;
      this.bossDefeatedReward();
    } else {
      resultTextWrapperElement.innerHTML += `<p> boss, ${this.bossBattle.name} beats Player, ${player.playerName}</p>`;
    }
  };
  this.updateHealthBar = function() {}; // for css
}
