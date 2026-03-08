Page({
  data: {
    level: 1,
    score: 0,
    lives: 3,
    mode: 'single',
    canvasWidth: 0,
    canvasHeight: 0,
    tank: {
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      direction: 'up',
      speed: 5
    },
    tank2: {
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      direction: 'up',
      speed: 5
    },
    bullets: [],
    enemies: [],
    walls: [],
    gameLoop: null,
    isMoving: false,
    moveDirection: '',
    isFiring: false,
    fireInterval: null
  },
  onLoad: function(options) {
    this.setData({
      level: parseInt(options.level) || 1,
      mode: options.mode || 'single'
    })
    this.initGame()
  },
  initGame: function() {
    const query = wx.createSelectorQuery()
    query.select('.game-canvas').boundingClientRect()
    query.exec((res) => {
      if (res[0]) {
        this.setData({
          canvasWidth: res[0].width,
          canvasHeight: res[0].height
        })
        this.initTank()
        this.initEnemies()
        this.initWalls()
        this.startGameLoop()
      }
    })
  },
  initTank: function() {
    const { canvasWidth, canvasHeight } = this.data
    this.setData({
      tank: {
        x: canvasWidth / 2 - 20,
        y: canvasHeight - 60,
        width: 40,
        height: 40,
        direction: 'up',
        speed: 5
      }
    })
    if (this.data.mode === 'multi') {
      this.setData({
        tank2: {
          x: canvasWidth / 2 + 40,
          y: canvasHeight - 60,
          width: 40,
          height: 40,
          direction: 'up',
          speed: 5
        }
      })
    }
  },
  initEnemies: function() {
    const { level, canvasWidth } = this.data
    const enemies = []
    const enemyCount = 3 + level * 2
    for (let i = 0; i < enemyCount; i++) {
      enemies.push({
        x: 50 + (i % 5) * 60,
        y: 50 + Math.floor(i / 5) * 60,
        width: 30,
        height: 30,
        direction: 'down',
        speed: 1 + level * 0.5,
        type: Math.random() > 0.5 ? 'normal' : 'fast'
      })
    }
    this.setData({ enemies })
  },
  initWalls: function() {
    const { canvasWidth, canvasHeight } = this.data
    const walls = []
    // 创建边界墙
    for (let x = 0; x < canvasWidth; x += 20) {
      walls.push({ x, y: 0, width: 20, height: 20 })
      walls.push({ x, y: canvasHeight - 20, width: 20, height: 20 })
    }
    for (let y = 0; y < canvasHeight; y += 20) {
      walls.push({ x: 0, y, width: 20, height: 20 })
      walls.push({ x: canvasWidth - 20, y, width: 20, height: 20 })
    }
    // 创建中间障碍物
    for (let i = 0; i < 10; i++) {
      walls.push({
        x: 100 + i * 40,
        y: 200,
        width: 20,
        height: 20
      })
    }
    this.setData({ walls })
  },
  startGameLoop: function() {
    this.data.gameLoop = setInterval(() => {
      this.update()
      this.render()
    }, 16)
  },
  update: function() {
    this.updateTank()
    this.updateBullets()
    this.updateEnemies()
    this.checkCollisions()
  },
  updateTank: function() {
    const { tank, moveDirection, canvasWidth, canvasHeight, walls } = this.data
    if (moveDirection) {
      let newX = tank.x
      let newY = tank.y
      switch (moveDirection) {
        case 'up':
          newY -= tank.speed
          break
        case 'down':
          newY += tank.speed
          break
        case 'left':
          newX -= tank.speed
          break
        case 'right':
          newX += tank.speed
          break
      }
      if (!this.checkWallCollision(newX, newY, tank.width, tank.height, walls)) {
        this.setData({
          tank: {
            ...tank,
            x: newX,
            y: newY,
            direction: moveDirection
          }
        })
      }
    }
  },
  updateBullets: function() {
    const { bullets, enemies, walls } = this.data
    let newBullets = []
    let score = this.data.score
    for (let bullet of bullets) {
      let newX = bullet.x
      let newY = bullet.y
      switch (bullet.direction) {
        case 'up':
          newY -= bullet.speed
          break
        case 'down':
          newY += bullet.speed
          break
        case 'left':
          newX -= bullet.speed
          break
        case 'right':
          newX += bullet.speed
          break
      }
      // 检查是否击中敌人
      let hitEnemy = false
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i]
        if (this.checkCollision(newX, newY, bullet.width, bullet.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
          enemies.splice(i, 1)
          score += 100
          hitEnemy = true
          break
        }
      }
      // 检查是否击中墙
      let hitWall = false
      for (let i = 0; i < walls.length; i++) {
        const wall = walls[i]
        if (this.checkCollision(newX, newY, bullet.width, bullet.height, wall.x, wall.y, wall.width, wall.height)) {
          hitWall = true
          break
        }
      }
      // 检查是否出界
      if (!hitEnemy && !hitWall && newX > 0 && newX < this.data.canvasWidth && newY > 0 && newY < this.data.canvasHeight) {
        newBullets.push({
          ...bullet,
          x: newX,
          y: newY
        })
      }
    }
    this.setData({
      bullets: newBullets,
      enemies,
      score
    })
    // 检查是否通关
    if (enemies.length === 0) {
      this.nextLevel()
    }
  },
  updateEnemies: function() {
    const { enemies, canvasWidth, walls } = this.data
    for (let enemy of enemies) {
      let newX = enemy.x
      let newY = enemy.y
      // 随机改变方向
      if (Math.random() < 0.01) {
        const directions = ['up', 'down', 'left', 'right']
        enemy.direction = directions[Math.floor(Math.random() * directions.length)]
      }
      switch (enemy.direction) {
        case 'up':
          newY -= enemy.speed
          break
        case 'down':
          newY += enemy.speed
          break
        case 'left':
          newX -= enemy.speed
          break
        case 'right':
          newX += enemy.speed
          break
      }
      if (!this.checkWallCollision(newX, newY, enemy.width, enemy.height, walls)) {
        enemy.x = newX
        enemy.y = newY
      } else {
        // 碰到墙就改变方向
        const directions = ['up', 'down', 'left', 'right']
        enemy.direction = directions[Math.floor(Math.random() * directions.length)]
      }
    }
    this.setData({ enemies })
  },
  checkCollisions: function() {
    const { tank, enemies, lives } = this.data
    // 检查坦克是否被敌人击中
    for (let enemy of enemies) {
      if (this.checkCollision(tank.x, tank.y, tank.width, tank.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
        this.setData({ lives: lives - 1 })
        if (this.data.lives <= 0) {
          this.gameOver()
        } else {
          this.initTank()
        }
        break
      }
    }
  },
  checkCollision: function(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
  },
  checkWallCollision: function(x, y, w, h, walls) {
    for (let wall of walls) {
      if (this.checkCollision(x, y, w, h, wall.x, wall.y, wall.width, wall.height)) {
        return true
      }
    }
    return false
  },
  render: function() {
    const ctx = wx.createCanvasContext('gameCanvas')
    const { tank, tank2, bullets, enemies, walls, mode } = this.data
    // 清空画布
    ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight)
    // 绘制墙
    ctx.fillStyle = '#666'
    for (let wall of walls) {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height)
    }
    // 绘制坦克
    ctx.fillStyle = '#0f0'
    ctx.fillRect(tank.x, tank.y, tank.width, tank.height)
    // 绘制坦克炮管
    ctx.fillStyle = '#0f0'
    switch (tank.direction) {
      case 'up':
        ctx.fillRect(tank.x + 15, tank.y - 10, 10, 10)
        break
      case 'down':
        ctx.fillRect(tank.x + 15, tank.y + 40, 10, 10)
        break
      case 'left':
        ctx.fillRect(tank.x - 10, tank.y + 15, 10, 10)
        break
      case 'right':
        ctx.fillRect(tank.x + 40, tank.y + 15, 10, 10)
        break
    }
    // 绘制第二辆坦克（双人模式）
    if (mode === 'multi') {
      ctx.fillStyle = '#00f'
      ctx.fillRect(tank2.x, tank2.y, tank2.width, tank2.height)
      // 绘制坦克炮管
      ctx.fillStyle = '#00f'
      switch (tank2.direction) {
        case 'up':
          ctx.fillRect(tank2.x + 15, tank2.y - 10, 10, 10)
          break
        case 'down':
          ctx.fillRect(tank2.x + 15, tank2.y + 40, 10, 10)
          break
        case 'left':
          ctx.fillRect(tank2.x - 10, tank2.y + 15, 10, 10)
          break
        case 'right':
          ctx.fillRect(tank2.x + 40, tank2.y + 15, 10, 10)
          break
      }
    }
    // 绘制子弹
    ctx.fillStyle = '#fff'
    for (let bullet of bullets) {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
    }
    // 绘制敌人
    for (let enemy of enemies) {
      ctx.fillStyle = '#f00'
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
    }
    ctx.draw()
  },
  moveUp: function() {
    this.setData({ moveDirection: 'up', isMoving: true })
  },
  moveDown: function() {
    this.setData({ moveDirection: 'down', isMoving: true })
  },
  moveLeft: function() {
    this.setData({ moveDirection: 'left', isMoving: true })
  },
  moveRight: function() {
    this.setData({ moveDirection: 'right', isMoving: true })
  },
  stopMove: function() {
    this.setData({ isMoving: false, moveDirection: '' })
  },
  fire: function() {
    if (!this.data.isFiring) {
      this.setData({ isFiring: true })
      this.fireBullet()
      this.data.fireInterval = setInterval(() => {
        this.fireBullet()
      }, 500)
    }
  },
  stopFire: function() {
    this.setData({ isFiring: false })
    if (this.data.fireInterval) {
      clearInterval(this.data.fireInterval)
      this.data.fireInterval = null
    }
  },
  fireBullet: function() {
    const { tank, bullets } = this.data
    let bulletX, bulletY
    switch (tank.direction) {
      case 'up':
        bulletX = tank.x + 15
        bulletY = tank.y - 10
        break
      case 'down':
        bulletX = tank.x + 15
        bulletY = tank.y + 40
        break
      case 'left':
        bulletX = tank.x - 10
        bulletY = tank.y + 15
        break
      case 'right':
        bulletX = tank.x + 40
        bulletY = tank.y + 15
        break
    }
    const newBullet = {
      x: bulletX,
      y: bulletY,
      width: 5,
      height: 5,
      direction: tank.direction,
      speed: 10
    }
    bullets.push(newBullet)
    this.setData({ bullets })
  },
  nextLevel: function() {
    const { level } = this.data
    if (level < 10) {
      this.setData({ level: level + 1 })
      this.initTank()
      this.initEnemies()
      this.initWalls()
    } else {
      this.gameWin()
    }
  },
  gameOver: function() {
    clearInterval(this.data.gameLoop)
    if (this.data.fireInterval) {
      clearInterval(this.data.fireInterval)
    }
    wx.showModal({
      title: '游戏结束',
      content: '是否重新开始？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ level: 1, score: 0, lives: 3 })
          this.initTank()
          this.initEnemies()
          this.initWalls()
          this.startGameLoop()
        } else {
          wx.navigateBack()
        }
      }
    })
  },
  gameWin: function() {
    clearInterval(this.data.gameLoop)
    if (this.data.fireInterval) {
      clearInterval(this.data.fireInterval)
    }
    wx.showModal({
      title: '游戏胜利',
      content: '恭喜你通关了！',
      success: (res) => {
        wx.navigateBack()
      }
    })
  },
  onUnload: function() {
    if (this.data.gameLoop) {
      clearInterval(this.data.gameLoop)
    }
    if (this.data.fireInterval) {
      clearInterval(this.data.fireInterval)
    }
  }
})