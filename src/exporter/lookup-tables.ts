// Auto-generated from NullLuaV1.1.lua - Pokemon Null lookup tables
// Lua arrays are 1-indexed. In these JS arrays:
// - moves[0] = "" (no move), moves[1] = "Pound" etc; species uses moves[moveId]
// - mons[0] = "Bulbasaur"; species ID 1 = mons[speciesId - 1]
// - items[0] = first item; item_id uses items[itemId - 1]
// - abilities[0] = "Stench"; ability ID 1 = abilities[abilityId - 1]
// - natures[0] = "Hardy"; nature ID 0 = natures[natureId]

export const MOVES: readonly string[] = [
  '', // 0
  'Pound', // 1
  'Karate Chop', // 2
  'Double Slap', // 3
  'Comet Punch', // 4
  'Mega Punch', // 5
  'Pay Day', // 6
  'Fire Punch', // 7
  'Ice Punch', // 8
  'Thunder Punch', // 9
  'Scratch', // 10
  'Vise Grip', // 11
  'Guillotine', // 12
  'Razor Wind', // 13
  'Swords Dance', // 14
  'Cut', // 15
  'Gust', // 16
  'Wing Attack', // 17
  'Whirlwind', // 18
  'Fly', // 19
  'Bind', // 20
  'Slam', // 21
  'Vine Whip', // 22
  'Stomp', // 23
  'Double Kick', // 24
  'Mega Kick', // 25
  'Jump Kick', // 26
  'Rolling Kick', // 27
  'Sand Attack', // 28
  'Headbutt', // 29
  'Horn Attack', // 30
  'Fury Attack', // 31
  'Horn Drill', // 32
  'Tackle', // 33
  'Body Slam', // 34
  'Wrap', // 35
  'Take Down', // 36
  'Thrash', // 37
  'Double-Edge', // 38
  'Tail Whip', // 39
  'Poison Sting', // 40
  'Twineedle', // 41
  'Pin Missile', // 42
  'Leer', // 43
  'Bite', // 44
  'Growl', // 45
  'Roar', // 46
  'Sing', // 47
  'Supersonic', // 48
  'Sonic Boom', // 49
  'Disable', // 50
  'Acid', // 51
  'Ember', // 52
  'Flamethrower', // 53
  'Mist', // 54
  'Water Gun', // 55
  'Hydro Pump', // 56
  'Surf', // 57
  'Ice Beam', // 58
  'Blizzard', // 59
  'Psybeam', // 60
  'Bubble Beam', // 61
  'Aurora Beam', // 62
  'Hyper Beam', // 63
  'Peck', // 64
  'Drill Peck', // 65
  'Submission', // 66
  'Low Kick', // 67
  'Counter', // 68
  'Seismic Toss', // 69
  'Strength', // 70
  'Absorb', // 71
  'Mega Drain', // 72
  'Leech Seed', // 73
  'Growth', // 74
  'Razor Leaf', // 75
  'Solar Beam', // 76
  'Poison Powder', // 77
  'Stun Spore', // 78
  'Sleep Powder', // 79
  'Petal Dance', // 80
  'String Shot', // 81
  'Dragon Rage', // 82
  'Fire Spin', // 83
  'Thunder Shock', // 84
  'Thunderbolt', // 85
  'Thunder Wave', // 86
  'Thunder', // 87
  'Rock Throw', // 88
  'Earthquake', // 89
  'Fissure', // 90
  'Dig', // 91
  'Toxic', // 92
  'Confusion', // 93
  'Psychic', // 94
  'Hypnosis', // 95
  'Meditate', // 96
  'Agility', // 97
  'Quick Attack', // 98
  'Rage', // 99
  'Teleport', // 100
  'Night Shade', // 101
  'Mimic', // 102
  'Screech', // 103
  'Double Team', // 104
  'Recover', // 105
  'Harden', // 106
  'Minimize', // 107
  'Smokescreen', // 108
  'Confuse Ray', // 109
  'Withdraw', // 110
  'Defense Curl', // 111
  'Barrier', // 112
  'Light Screen', // 113
  'Haze', // 114
  'Reflect', // 115
  'Focus Energy', // 116
  'Bide', // 117
  'Metronome', // 118
  'Mirror Move', // 119
  'Self-Destruct', // 120
  'Egg Bomb', // 121
  'Lick', // 122
  'Smog', // 123
  'Sludge', // 124
  'Bone Club', // 125
  'Fire Blast', // 126
  'Waterfall', // 127
  'Clamp', // 128
  'Swift', // 129
  'Skull Bash', // 130
  'Spike Cannon', // 131
  'Constrict', // 132
  'Amnesia', // 133
  'Kinesis', // 134
  'Soft Boiled', // 135
  'High Jump Kick', // 136
  'Glare', // 137
  'Dream Eater', // 138
  'Poison Gas', // 139
  'Barrage', // 140
  'Leech Life', // 141
  'Lovely Kiss', // 142
  'Sky Attack', // 143
  'Transform', // 144
  'Bubble', // 145
  'Dizzy Punch', // 146
  'Spore', // 147
  'Flash', // 148
  'Psywave', // 149
  'Splash', // 150
  'Acid Armor', // 151
  'Crabhammer', // 152
  'Explosion', // 153
  'Fury Swipes', // 154
  'Bonemerang', // 155
  'Rest', // 156
  'Rock Slide', // 157
  'Hyper Fang', // 158
  'Sharpen', // 159
  'Conversion', // 160
  'Tri Attack', // 161
  'Super Fang', // 162
  'Slash', // 163
  'Substitute', // 164
  'Struggle', // 165
  'Sketch', // 166
  'Triple Kick', // 167
  'Thief', // 168
  'Spider Web', // 169
  'Mind Reader', // 170
  'Nightmare', // 171
  'Flame Wheel', // 172
  'Snore', // 173
  'Curse', // 174
  'Flail', // 175
  'Conversion 2', // 176
  'Aeroblast', // 177
  'Cotton Spore', // 178
  'Reversal', // 179
  'Spite', // 180
  'Powder Snow', // 181
  'Protect', // 182
  'Mach Punch', // 183
  'Scary Face', // 184
  'Feint Attack', // 185
  'Sweet Kiss', // 186
  'Belly Drum', // 187
  'Sludge Bomb', // 188
  'Mud-Slap', // 189
  'Octazooka', // 190
  'Spikes', // 191
  'Zap Cannon', // 192
  'Foresight', // 193
  'Destiny Bond', // 194
  'Perish Song', // 195
  'Icy Wind', // 196
  'Detect', // 197
  'Bone Rush', // 198
  'Lock-On', // 199
  'Outrage', // 200
  'Sandstorm', // 201
  'Giga Drain', // 202
  'Endure', // 203
  'Charm', // 204
  'Rollout', // 205
  'False Swipe', // 206
  'Swagger', // 207
  'Milk Drink', // 208
  'Spark', // 209
  'Fury Cutter', // 210
  'Steel Wing', // 211
  'Mean Look', // 212
  'Attract', // 213
  'Sleep Talk', // 214
  'Heal Bell', // 215
  'Return', // 216
  'Present', // 217
  'Frustration', // 218
  'Safeguard', // 219
  'Pain Split', // 220
  'Sacred Fire', // 221
  'Magnitude', // 222
  'Dynamic Punch', // 223
  'Megahorn', // 224
  'Dragon Breath', // 225
  'Baton Pass', // 226
  'Encore', // 227
  'Pursuit', // 228
  'Rapid Spin', // 229
  'Sweet Scent', // 230
  'Iron Tail', // 231
  'Metal Claw', // 232
  'Vital Throw', // 233
  'Morning Sun', // 234
  'Synthesis', // 235
  'Moonlight', // 236
  'Hidden Power', // 237
  'Cross Chop', // 238
  'Twister', // 239
  'Rain Dance', // 240
  'Sunny Day', // 241
  'Crunch', // 242
  'Mirror Coat', // 243
  'Psych Up', // 244
  'Extreme Speed', // 245
  'Ancient Power', // 246
  'Shadow Ball', // 247
  'Future Sight', // 248
  'Rock Smash', // 249
  'Whirlpool', // 250
  'Beat Up', // 251
  'Fake Out', // 252
  'Uproar', // 253
  'Stockpile', // 254
  'Spit Up', // 255
  'Swallow', // 256
  'Heat Wave', // 257
  'Hail', // 258
  'Torment', // 259
  'Flatter', // 260
  'Will-O-Wisp', // 261
  'Memento', // 262
  'Facade', // 263
  'Focus Punch', // 264
  'Smelling Salts', // 265
  'Follow Me', // 266
  'Nature Power', // 267
  'Charge', // 268
  'Taunt', // 269
  'Helping Hand', // 270
  'Trick', // 271
  'Role Play', // 272
  'Wish', // 273
  'Assist', // 274
  'Ingrain', // 275
  'Superpower', // 276
  'Magic Coat', // 277
  'Recycle', // 278
  'Revenge', // 279
  'Brick Break', // 280
  'Yawn', // 281
  'Knock Off', // 282
  'Endeavor', // 283
  'Eruption', // 284
  'Skill Swap', // 285
  'Imprison', // 286
  'Refresh', // 287
  'Grudge', // 288
  'Snatch', // 289
  'Secret Power', // 290
  'Dive', // 291
  'Arm Thrust', // 292
  'Camouflage', // 293
  'Tail Glow', // 294
  'Luster Purge', // 295
  'Mist Ball', // 296
  'Feather Dance', // 297
  'Teeter Dance', // 298
  'Blaze Kick', // 299
  'Mud Sport', // 300
  'Ice Ball', // 301
  'Needle Arm', // 302
  'Slack Off', // 303
  'Hyper Voice', // 304
  'Poison Fang', // 305
  'Crush Claw', // 306
  'Blast Burn', // 307
  'Hydro Cannon', // 308
  'Meteor Mash', // 309
  'Astonish', // 310
  'Weather Ball', // 311
  'Aromatherapy', // 312
  'Fake Tears', // 313
  'Air Cutter', // 314
  'Overheat', // 315
  'Odor Sleuth', // 316
  'Rock Tomb', // 317
  'Silver Wind', // 318
  'Metal Sound', // 319
  'Grass Whistle', // 320
  'Tickle', // 321
  'Cosmic Power', // 322
  'Water Spout', // 323
  'Signal Beam', // 324
  'Shadow Punch', // 325
  'Extrasensory', // 326
  'Sky Uppercut', // 327
  'Sand Tomb', // 328
  'Sheer Cold', // 329
  'Muddy Water', // 330
  'Bullet Seed', // 331
  'Aerial Ace', // 332
  'Icicle Spear', // 333
  'Iron Defense', // 334
  'Block', // 335
  'Howl', // 336
  'Dragon Claw', // 337
  'Frenzy Plant', // 338
  'Bulk Up', // 339
  'Bounce', // 340
  'Mud Shot', // 341
  'Poison Tail', // 342
  'Covet', // 343
  'Volt Tackle', // 344
  'Magical Leaf', // 345
  'Water Sport', // 346
  'Calm Mind', // 347
  'Leaf Blade', // 348
  'Dragon Dance', // 349
  'Rock Blast', // 350
  'Shock Wave', // 351
  'Water Pulse', // 352
  'Doom Desire', // 353
  'Psycho Boost', // 354
  'Roost', // 355
  'Gravity', // 356
  'Miracle Eye', // 357
  'Wake-Up Slap', // 358
  'Hammer Arm', // 359
  'Gyro Ball', // 360
  'Healing Wish', // 361
  'Brine', // 362
  'Natural Gift', // 363
  'Feint', // 364
  'Pluck', // 365
  'Tailwind', // 366
  'Acupressure', // 367
  'Metal Burst', // 368
  'U-turn', // 369
  'Close Combat', // 370
  'Payback', // 371
  'Assurance', // 372
  'Embargo', // 373
  'Fling', // 374
  'Psycho Shift', // 375
  'Trump Card', // 376
  'Heal Block', // 377
  'Wring Out', // 378
  'Power Trick', // 379
  'Gastro Acid', // 380
  'Lucky Chant', // 381
  'Me First', // 382
  'Copycat', // 383
  'Power Swap', // 384
  'Guard Swap', // 385
  'Punishment', // 386
  'Last Resort', // 387
  'Worry Seed', // 388
  'Sucker Punch', // 389
  'Toxic Spikes', // 390
  'Heart Swap', // 391
  'Aqua Ring', // 392
  'Magnet Rise', // 393
  'Flare Blitz', // 394
  'Force Palm', // 395
  'Aura Sphere', // 396
  'Rock Polish', // 397
  'Poison Jab', // 398
  'Dark Pulse', // 399
  'Night Slash', // 400
  'Aqua Tail', // 401
  'Seed Bomb', // 402
  'Air Slash', // 403
  'X-Scissor', // 404
  'Bug Buzz', // 405
  'Dragon Pulse', // 406
  'Dragon Rush', // 407
  'Power Gem', // 408
  'Drain Punch', // 409
  'Vacuum Wave', // 410
  'Focus Blast', // 411
  'Energy Ball', // 412
  'Brave Bird', // 413
  'Earth Power', // 414
  'Switcheroo', // 415
  'Giga Impact', // 416
  'Nasty Plot', // 417
  'Bullet Punch', // 418
  'Avalanche', // 419
  'Ice Shard', // 420
  'Shadow Claw', // 421
  'Thunder Fang', // 422
  'Ice Fang', // 423
  'Fire Fang', // 424
  'Shadow Sneak', // 425
  'Mud Bomb', // 426
  'Psycho Cut', // 427
  'Zen Headbutt', // 428
  'Mirror Shot', // 429
  'Flash Cannon', // 430
  'Rock Climb', // 431
  'Defog', // 432
  'Trick Room', // 433
  'Draco Meteor', // 434
  'Discharge', // 435
  'Lava Plume', // 436
  'Leaf Storm', // 437
  'Power Whip', // 438
  'Rock Wrecker', // 439
  'Cross Poison', // 440
  'Gunk Shot', // 441
  'Iron Head', // 442
  'Magnet Bomb', // 443
  'Stone Edge', // 444
  'Captivate', // 445
  'Stealth Rock', // 446
  'Grass Knot', // 447
  'Chatter', // 448
  'Judgment', // 449
  'Bug Bite', // 450
  'Charge Beam', // 451
  'Wood Hammer', // 452
  'Aqua Jet', // 453
  'Attack Order', // 454
  'Defend Order', // 455
  'Heal Order', // 456
  'Head Smash', // 457
  'Double Hit', // 458
  'Roar of Time', // 459
  'Spacial Rend', // 460
  'Lunar Dance', // 461
  'Crush Grip', // 462
  'Magma Storm', // 463
  'Dark Void', // 464
  'Seed Flare', // 465
  'Ominous Wind', // 466
  'Shadow Force', // 467
  'Hone Claws', // 468
  'Wide Guard', // 469
  'Guard Split', // 470
  'Power Split', // 471
  'Wonder Room', // 472
  'Psyshock', // 473
  'Venoshock', // 474
  'Autotomize', // 475
  'Rage Powder', // 476
  'Telekinesis', // 477
  'Magic Room', // 478
  'Smack Down', // 479
  'Storm Throw', // 480
  'Flame Burst', // 481
  'Sludge Wave', // 482
  'Quiver Dance', // 483
  'Heavy Slam', // 484
  'Synchronoise', // 485
  'Electro Ball', // 486
  'Soak', // 487
  'Flame Charge', // 488
  'Coil', // 489
  'Low Sweep', // 490
  'Acid Spray', // 491
  'Foul Play', // 492
  'Simple Beam', // 493
  'Entrainment', // 494
  'After You', // 495
  'Round', // 496
  'Echoed Voice', // 497
  'Chip Away', // 498
  'Clear Smog', // 499
  'Stored Power', // 500
  'Quick Guard', // 501
  'Ally Switch', // 502
  'Scald', // 503
  'Shell Smash', // 504
  'Heal Pulse', // 505
  'Hex', // 506
  'Sky Drop', // 507
  'Shift Gear', // 508
  'Circle Throw', // 509
  'Incinerate', // 510
  'Quash', // 511
  'Acrobatics', // 512
  'Reflect Type', // 513
  'Retaliate', // 514
  'Final Gambit', // 515
  'Bestow', // 516
  'Inferno', // 517
  'Water Pledge', // 518
  'Fire Pledge', // 519
  'Grass Pledge', // 520
  'Volt Switch', // 521
  'Struggle Bug', // 522
  'Bulldoze', // 523
  'Frost Breath', // 524
  'Dragon Tail', // 525
  'Work Up', // 526
  'Electroweb', // 527
  'Wild Charge', // 528
  'Drill Run', // 529
  'Dual Chop', // 530
  'Heart Stamp', // 531
  'Horn Leech', // 532
  'Sacred Sword', // 533
  'Razor Shell', // 534
  'Heat Crash', // 535
  'Leaf Tornado', // 536
  'Steamroller', // 537
  'Cotton Guard', // 538
  'Night Daze', // 539
  'Psystrike', // 540
  'Tail Slap', // 541
  'Hurricane', // 542
  'Head Charge', // 543
  'Gear Grind', // 544
  'Searing Shot', // 545
  'Techno Blast', // 546
  'Relic Song', // 547
  'Secret Sword', // 548
  'Glaciate', // 549
  'Bolt Strike', // 550
  'Blue Flare', // 551
  'Fiery Dance', // 552
  'Freeze Shock', // 553
  'Ice Burn', // 554
  'Snarl', // 555
  'Icicle Crash', // 556
  'V-create', // 557
  'Fusion Flare', // 558
  'Fusion Bolt', // 559
  'Flying Press', // 560
  'Mat Block', // 561
  'Belch', // 562
  'Rototiller', // 563
  'Sticky Web', // 564
  'Fell Stinger', // 565
  'Phantom Force', // 566
  'Trick-or-Treat', // 567
  'Noble Roar', // 568
  'Ion Deluge', // 569
  'Parabolic Charge', // 570
  'Forest\'s Curse', // 571
  'Petal Blizzard', // 572
  'Freeze-Dry', // 573
  'Disarming Voice', // 574
  'Parting Shot', // 575
  'Topsy-Turvy', // 576
  'Draining Kiss', // 577
  'Crafty Shield', // 578
  'Flower Shield', // 579
  'Grassy Terrain', // 580
  'Misty Terrain', // 581
  'Electrify', // 582
  'Play Rough', // 583
  'Fairy Wind', // 584
  'Moonblast', // 585
  'Boomburst', // 586
  'Fairy Lock', // 587
  'King\'s Shield', // 588
  'Play Nice', // 589
  'Confide', // 590
  'Diamond Storm', // 591
  'Steam Eruption', // 592
  'Hyperspace Hole', // 593
  'Water Shuriken', // 594
  'Mystical Fire', // 595
  'Spiky Shield', // 596
  'Aromatic Mist', // 597
  'Eerie Impulse', // 598
  'Venom Drench', // 599
  'Powder', // 600
  'Geomancy', // 601
  'Magnetic Flux', // 602
  'Happy Hour', // 603
  'Electric Terrain', // 604
  'Dazzling Gleam', // 605
  'Celebrate', // 606
  'Hold Hands', // 607
  'Baby-Doll Eyes', // 608
  'Nuzzle', // 609
  'Hold Back', // 610
  'Infestation', // 611
  'Power-Up Punch', // 612
  'Oblivion Wing', // 613
  'Thousand Arrows', // 614
  'Thousand Waves', // 615
  'Land\'s Wrath', // 616
  'Light of Ruin', // 617
  'Origin Pulse', // 618
  'Precipice Blades', // 619
  'Dragon Ascent', // 620
  'Hyperspace Fury', // 621
  'Shore Up', // 622
  'First Impression', // 623
  'Baneful Bunker', // 624
  'Spirit Shackle', // 625
  'Darkest Lariat', // 626
  'Sparkling Aria', // 627
  'Ice Hammer', // 628
  'Floral Healing', // 629
  'High Horsepower', // 630
  'Strength Sap', // 631
  'Solar Blade', // 632
  'Leafage', // 633
  'Spotlight', // 634
  'Toxic Thread', // 635
  'Laser Focus', // 636
  'Gear Up', // 637
  'Throat Chop', // 638
  'Pollen Puff', // 639
  'Anchor Shot', // 640
  'Psychic Terrain', // 641
  'Lunge', // 642
  'Fire Lash', // 643
  'Power Trip', // 644
  'Burn Up', // 645
  'Speed Swap', // 646
  'Smart Strike', // 647
  'Purify', // 648
  'Revelation Dance', // 649
  'Core Enforcer', // 650
  'Trop Kick', // 651
  'Instruct', // 652
  'Beak Blast', // 653
  'Clanging Scales', // 654
  'Dragon Hammer', // 655
  'Brutal Swing', // 656
  'Aurora Veil', // 657
  'Shell Trap', // 658
  'Fleur Cannon', // 659
  'Psychic Fangs', // 660
  'Stomping Tantrum', // 661
  'Shadow Bone', // 662
  'Accelerock', // 663
  'Liquidation', // 664
  'Prismatic Laser', // 665
  'Spectral Thief', // 666
  'Sunsteel Strike', // 667
  'Moongeist Beam', // 668
  'Tearful Look', // 669
  'Zing Zap', // 670
  'Nature\'s Madness', // 671
  'Multi-Attack', // 672
  'Mind Blown', // 673
  'Plasma Fists', // 674
  'Photon Geyser', // 675
  'Zippy Zap', // 676
  'Splishy Splash', // 677
  'Floaty Fall', // 678
  'Pika Papow', // 679
  'Bouncy Bubble', // 680
  'Buzzy Buzz', // 681
  'Sizzly Slide', // 682
  'Glitzy Glow', // 683
  'Baddy Bad', // 684
  'Sappy Seed', // 685
  'Freezy Frost', // 686
  'Sparkly Swirl', // 687
  'Veevee Volley', // 688
  'Double Iron Bash', // 689
  'Dynamax Cannon', // 690
  'Snipe Shot', // 691
  'Jaw Lock', // 692
  'Stuff Cheeks', // 693
  'No Retreat', // 694
  'Tar Shot', // 695
  'Magic Powder', // 696
  'Dragon Darts', // 697
  'Teatime', // 698
  'Octolock', // 699
  'Bolt Beak', // 700
  'Fishious Rend', // 701
  'Court Change', // 702
  'Clangorous Soul', // 703
  'Body Press', // 704
  'Decorate', // 705
  'Drum Beating', // 706
  'Snap Trap', // 707
  'Pyro Ball', // 708
  'Behemoth Blade', // 709
  'Behemoth Bash', // 710
  'Aura Wheel', // 711
  'Breaking Swipe', // 712
  'Branch Poke', // 713
  'Overdrive', // 714
  'Apple Acid', // 715
  'Grav Apple', // 716
  'Spirit Break', // 717
  'Strange Steam', // 718
  'Life Dew', // 719
  'Obstruct', // 720
  'False Surrender', // 721
  'Meteor Assault', // 722
  'Eternabeam', // 723
  'Steel Beam', // 724
  'Expanding Force', // 725
  'Steel Roller', // 726
  'Scale Shot', // 727
  'Meteor Beam', // 728
  'Shell Side Arm', // 729
  'Misty Explosion', // 730
  'Grassy Glide', // 731
  'Rising Voltage', // 732
  'Terrain Pulse', // 733
  'Skitter Smack', // 734
  'Burning Jealousy', // 735
  'Lash Out', // 736
  'Poltergeist', // 737
  'Corrosive Gas', // 738
  'Coaching', // 739
  'Flip Turn', // 740
  'Triple Axel', // 741
  'Dual Wingbeat', // 742
  'Scorching Sands', // 743
  'Jungle Healing', // 744
  'Wicked Blow', // 745
  'Surging Strikes', // 746
  'Thunder Cage', // 747
  'Dragon Energy', // 748
  'Freezing Glare', // 749
  'Fiery Wrath', // 750
  'Thunderous Kick', // 751
  'Glacial Lance', // 752
  'Astral Barrage', // 753
  'Eerie Spell', // 754
  'Dire Claw', // 755
  'Psyshield Bash', // 756
  'Power Shift', // 757
  'Stone Axe', // 758
  'Springtide Storm', // 759
  'Mystical Power', // 760
  'Raging Fury', // 761
  'Wave Crash', // 762
  'Chloroblast', // 763
  'Mountain Gale', // 764
  'Victory Dance', // 765
  'Headlong Rush', // 766
  'Barb Barrage', // 767
  'Esper Wing', // 768
  'Bitter Malice', // 769
  'Shelter', // 770
  'Triple Arrows', // 771
  'Infernal Parade', // 772
  'Ceaseless Edge', // 773
  'Bleakwind Storm', // 774
  'Wildbolt Storm', // 775
  'Sandsear Storm', // 776
  'Lunar Blessing', // 777
  'Take Heart', // 778
  'Tera Blast', // 779
  'Silk Trap', // 780
  'Axe Kick', // 781
  'Last Respects', // 782
  'Lumina Crash', // 783
  'Order Up', // 784
  'Jet Punch', // 785
  'Spicy Extract', // 786
  'Spin Out', // 787
  'Population Bomb', // 788
  'Ice Spinner', // 789
  'Glaive Rush', // 790
  'Revival Blessing', // 791
  'Salt Cure', // 792
  'Triple Dive', // 793
  'Mortal Spin', // 794
  'Doodle', // 795
  'Fillet Away', // 796
  'Kowtow Cleave', // 797
  'Flower Trick', // 798
  'Torch Song', // 799
  'Aqua Step', // 800
  'Raging Bull', // 801
  'Make It Rain', // 802
  'Ruination', // 803
  'Collision Course', // 804
  'Electro Drift', // 805
  'Shed Tail', // 806
  'Chilly Reception', // 807
  'Tidy Up', // 808
  'Snowscape', // 809
  'Pounce', // 810
  'Trailblaze', // 811
  'Chilling Water', // 812
  'Hyper Drill', // 813
  'Twin Beam', // 814
  'Rage Fist', // 815
  'Armor Cannon', // 816
  'Bitter Blade', // 817
  'Double Shock', // 818
  'Gigaton Hammer', // 819
  'Comeuppance', // 820
  'Aqua Cutter', // 821
  'Blazing Torque', // 822
  'Wicked Torque', // 823
  'Noxious Torque', // 824
  'Combat Torque', // 825
  'Magical Torque', // 826
  'Psyblade', // 827
  'Hydro Steam', // 828
  'Blood Moon', // 829
  'Matcha Gotcha', // 830
  'Syrup Bomb', // 831
  'Ivy Cudgel', // 832
  'Electro Shot', // 833
  'Tera Starstorm', // 834
  'Fickle Beam', // 835
  'Burning Bulwark', // 836
  'Thunderclap', // 837
  'Mighty Cleave', // 838
  'Tachyon Cutter', // 839
  'Hard Press', // 840
  'Dragon Cheer', // 841
  'Alluring Voice', // 842
  'Temper Flare', // 843
  'Supercell Slam', // 844
  'Psychic Noise', // 845
  'Upper Hand', // 846
  'Malignant Chain', // 847
  'Nihil Light', // 848
];

export const SPECIES_NAMES: readonly string[] = [
  'Bulbasaur', // 0
  'Ivysaur', // 1
  'Venusaur', // 2
  'Charmander', // 3
  'Charmeleon', // 4
  'Charizard', // 5
  'Squirtle', // 6
  'Wartortle', // 7
  'Blastoise', // 8
  'Caterpie', // 9
  'Metapod', // 10
  'Butterfree', // 11
  'Weedle', // 12
  'Kakuna', // 13
  'Beedrill', // 14
  'Pidgey', // 15
  'Pidgeotto', // 16
  'Pidgeot', // 17
  'Rattata', // 18
  'Raticate', // 19
  'Spearow', // 20
  'Fearow', // 21
  'Ekans', // 22
  'Arbok', // 23
  'Pikachu', // 24
  'Raichu', // 25
  'Sandshrew', // 26
  'Sandslash', // 27
  'Nidoran-F', // 28
  'Nidorina', // 29
  'Nidoqueen', // 30
  'Nidoran-M', // 31
  'Nidorino', // 32
  'Nidoking', // 33
  'Clefairy', // 34
  'Clefable', // 35
  'Vulpix', // 36
  'Ninetales', // 37
  'Jigglypuff', // 38
  'Wigglytuff', // 39
  'Zubat', // 40
  'Golbat', // 41
  'Oddish', // 42
  'Gloom', // 43
  'Vileplume', // 44
  'Paras', // 45
  'Parasect', // 46
  'Venonat', // 47
  'Venomoth', // 48
  'Diglett', // 49
  'Dugtrio', // 50
  'Meowth', // 51
  'Persian', // 52
  'Psyduck', // 53
  'Golduck', // 54
  'Mankey', // 55
  'Primeape', // 56
  'Growlithe', // 57
  'Arcanine', // 58
  'Poliwag', // 59
  'Poliwhirl', // 60
  'Poliwrath', // 61
  'Abra', // 62
  'Kadabra', // 63
  'Alakazam', // 64
  'Machop', // 65
  'Machoke', // 66
  'Machamp', // 67
  'Bellsprout', // 68
  'Weepinbell', // 69
  'Victreebel', // 70
  'Tentacool', // 71
  'Tentacruel', // 72
  'Geodude', // 73
  'Graveler', // 74
  'Golem', // 75
  'Ponyta', // 76
  'Rapidash', // 77
  'Slowpoke', // 78
  'Slowbro', // 79
  'Magnemite', // 80
  'Magneton', // 81
  'Farfetch’d', // 82
  'Doduo', // 83
  'Dodrio', // 84
  'Seel', // 85
  'Dewgong', // 86
  'Grimer', // 87
  'Muk', // 88
  'Shellder', // 89
  'Cloyster', // 90
  'Gastly', // 91
  'Haunter', // 92
  'Gengar', // 93
  'Onix', // 94
  'Drowzee', // 95
  'Hypno', // 96
  'Krabby', // 97
  'Kingler', // 98
  'Voltorb', // 99
  'Electrode', // 100
  'Exeggcute', // 101
  'Exeggutor', // 102
  'Cubone', // 103
  'Marowak', // 104
  'Hitmonlee', // 105
  'Hitmonchan', // 106
  'Lickitung', // 107
  'Koffing', // 108
  'Weezing', // 109
  'Rhyhorn', // 110
  'Rhydon', // 111
  'Chansey', // 112
  'Tangela', // 113
  'Kangaskhan', // 114
  'Horsea', // 115
  'Seadra', // 116
  'Goldeen', // 117
  'Seaking', // 118
  'Staryu', // 119
  'Starmie', // 120
  'Mr. Mime', // 121
  'Scyther', // 122
  'Jynx', // 123
  'Electabuzz', // 124
  'Magmar', // 125
  'Pinsir', // 126
  'Tauros', // 127
  'Magikarp', // 128
  'Gyarados', // 129
  'Lapras', // 130
  'Ditto', // 131
  'Eevee', // 132
  'Vaporeon', // 133
  'Jolteon', // 134
  'Flareon', // 135
  'Porygon', // 136
  'Omanyte', // 137
  'Omastar', // 138
  'Kabuto', // 139
  'Kabutops', // 140
  'Aerodactyl', // 141
  'Snorlax', // 142
  'Articuno', // 143
  'Zapdos', // 144
  'Moltres', // 145
  'Dratini', // 146
  'Dragonair', // 147
  'Dragonite', // 148
  'Mewtwo', // 149
  'Mew', // 150
  'Chikorita', // 151
  'Bayleef', // 152
  'Meganium', // 153
  'Cyndaquil', // 154
  'Quilava', // 155
  'Typhlosion', // 156
  'Totodile', // 157
  'Croconaw', // 158
  'Feraligatr', // 159
  'Sentret', // 160
  'Furret', // 161
  'Hoothoot', // 162
  'Noctowl', // 163
  'Ledyba', // 164
  'Ledian', // 165
  'Spinarak', // 166
  'Ariados', // 167
  'Crobat', // 168
  'Chinchou', // 169
  'Lanturn', // 170
  'Pichu', // 171
  'Cleffa', // 172
  'Igglybuff', // 173
  'Togepi', // 174
  'Togetic', // 175
  'Natu', // 176
  'Xatu', // 177
  'Mareep', // 178
  'Flaaffy', // 179
  'Ampharos', // 180
  'Bellossom', // 181
  'Marill', // 182
  'Azumarill', // 183
  'Sudowoodo', // 184
  'Politoed', // 185
  'Hoppip', // 186
  'Skiploom', // 187
  'Jumpluff', // 188
  'Aipom', // 189
  'Sunkern', // 190
  'Sunflora', // 191
  'Yanma', // 192
  'Wooper', // 193
  'Quagsire', // 194
  'Espeon', // 195
  'Umbreon', // 196
  'Murkrow', // 197
  'Slowking', // 198
  'Misdreavus', // 199
  'Unown', // 200
  'Wobbuffet', // 201
  'Girafarig', // 202
  'Pineco', // 203
  'Forretress', // 204
  'Dunsparce', // 205
  'Gligar', // 206
  'Steelix', // 207
  'Snubbull', // 208
  'Granbull', // 209
  'Qwilfish', // 210
  'Scizor', // 211
  'Shuckle', // 212
  'Heracross', // 213
  'Sneasel', // 214
  'Teddiursa', // 215
  'Ursaring', // 216
  'Slugma', // 217
  'Magcargo', // 218
  'Swinub', // 219
  'Piloswine', // 220
  'Corsola', // 221
  'Remoraid', // 222
  'Octillery', // 223
  'Delibird', // 224
  'Mantine', // 225
  'Skarmory', // 226
  'Houndour', // 227
  'Houndoom', // 228
  'Kingdra', // 229
  'Phanpy', // 230
  'Donphan', // 231
  'Porygon2', // 232
  'Stantler', // 233
  'Smeargle', // 234
  'Tyrogue', // 235
  'Hitmontop', // 236
  'Smoochum', // 237
  'Elekid', // 238
  'Magby', // 239
  'Miltank', // 240
  'Blissey', // 241
  'Raikou', // 242
  'Entei', // 243
  'Suicune', // 244
  'Larvitar', // 245
  'Pupitar', // 246
  'Tyranitar', // 247
  'Lugia', // 248
  'Ho-Oh', // 249
  'Celebi', // 250
  'Treecko', // 251
  'Grovyle', // 252
  'Sceptile', // 253
  'Torchic', // 254
  'Combusken', // 255
  'Blaziken', // 256
  'Mudkip', // 257
  'Marshtomp', // 258
  'Swampert', // 259
  'Poochyena', // 260
  'Mightyena', // 261
  'Zigzagoon', // 262
  'Linoone', // 263
  'Wurmple', // 264
  'Silcoon', // 265
  'Beautifly', // 266
  'Cascoon', // 267
  'Dustox', // 268
  'Lotad', // 269
  'Lombre', // 270
  'Ludicolo', // 271
  'Seedot', // 272
  'Nuzleaf', // 273
  'Shiftry', // 274
  'Taillow', // 275
  'Swellow', // 276
  'Wingull', // 277
  'Pelipper', // 278
  'Ralts', // 279
  'Kirlia', // 280
  'Gardevoir', // 281
  'Surskit', // 282
  'Masquerain', // 283
  'Shroomish', // 284
  'Breloom', // 285
  'Slakoth', // 286
  'Vigoroth', // 287
  'Slaking', // 288
  'Nincada', // 289
  'Ninjask', // 290
  'Shedinja', // 291
  'Whismur', // 292
  'Loudred', // 293
  'Exploud', // 294
  'Makuhita', // 295
  'Hariyama', // 296
  'Azurill', // 297
  'Nosepass', // 298
  'Skitty', // 299
  'Delcatty', // 300
  'Sableye', // 301
  'Mawile', // 302
  'Aron', // 303
  'Lairon', // 304
  'Aggron', // 305
  'Meditite', // 306
  'Medicham', // 307
  'Electrike', // 308
  'Manectric', // 309
  'Plusle', // 310
  'Minun', // 311
  'Volbeat', // 312
  'Illumise', // 313
  'Roselia', // 314
  'Gulpin', // 315
  'Swalot', // 316
  'Carvanha', // 317
  'Sharpedo', // 318
  'Wailmer', // 319
  'Wailord', // 320
  'Numel', // 321
  'Camerupt', // 322
  'Torkoal', // 323
  'Spoink', // 324
  'Grumpig', // 325
  'Spinda', // 326
  'Trapinch', // 327
  'Vibrava', // 328
  'Flygon', // 329
  'Cacnea', // 330
  'Cacturne', // 331
  'Swablu', // 332
  'Altaria', // 333
  'Zangoose', // 334
  'Seviper', // 335
  'Lunatone', // 336
  'Solrock', // 337
  'Barboach', // 338
  'Whiscash', // 339
  'Corphish', // 340
  'Crawdaunt', // 341
  'Baltoy', // 342
  'Claydol', // 343
  'Lileep', // 344
  'Cradily', // 345
  'Anorith', // 346
  'Armaldo', // 347
  'Feebas', // 348
  'Milotic', // 349
  'Castform', // 350
  'Kecleon', // 351
  'Shuppet', // 352
  'Banette', // 353
  'Duskull', // 354
  'Dusclops', // 355
  'Tropius', // 356
  'Chimecho', // 357
  'Absol', // 358
  'Wynaut', // 359
  'Snorunt', // 360
  'Glalie', // 361
  'Spheal', // 362
  'Sealeo', // 363
  'Walrein', // 364
  'Clamperl', // 365
  'Huntail', // 366
  'Gorebyss', // 367
  'Relicanth', // 368
  'Luvdisc', // 369
  'Bagon', // 370
  'Shelgon', // 371
  'Salamence', // 372
  'Beldum', // 373
  'Metang', // 374
  'Metagross', // 375
  'Regirock', // 376
  'Regice', // 377
  'Registeel', // 378
  'Latias', // 379
  'Latios', // 380
  'Kyogre', // 381
  'Groudon', // 382
  'Rayquaza', // 383
  'Jirachi', // 384
  'Deoxys', // 385
  'Turtwig', // 386
  'Grotle', // 387
  'Torterra', // 388
  'Chimchar', // 389
  'Monferno', // 390
  'Infernape', // 391
  'Piplup', // 392
  'Prinplup', // 393
  'Empoleon', // 394
  'Starly', // 395
  'Staravia', // 396
  'Staraptor', // 397
  'Bidoof', // 398
  'Bibarel', // 399
  'Kricketot', // 400
  'Kricketune', // 401
  'Shinx', // 402
  'Luxio', // 403
  'Luxray', // 404
  'Budew', // 405
  'Roserade', // 406
  'Cranidos', // 407
  'Rampardos', // 408
  'Shieldon', // 409
  'Bastiodon', // 410
  'Burmy', // 411
  'Wormadam', // 412
  'Mothim', // 413
  'Combee', // 414
  'Vespiquen', // 415
  'Pachirisu', // 416
  'Buizel', // 417
  'Floatzel', // 418
  'Cherubi', // 419
  'Cherrim', // 420
  'Shellos', // 421
  'Gastrodon', // 422
  'Ambipom', // 423
  'Drifloon', // 424
  'Drifblim', // 425
  'Buneary', // 426
  'Lopunny', // 427
  'Mismagius', // 428
  'Honchkrow', // 429
  'Glameow', // 430
  'Purugly', // 431
  'Chingling', // 432
  'Stunky', // 433
  'Skuntank', // 434
  'Bronzor', // 435
  'Bronzong', // 436
  'Bonsly', // 437
  'Mime Jr.', // 438
  'Happiny', // 439
  'Chatot', // 440
  'Spiritomb', // 441
  'Gible', // 442
  'Gabite', // 443
  'Garchomp', // 444
  'Munchlax', // 445
  'Riolu', // 446
  'Lucario', // 447
  'Hippopotas', // 448
  'Hippowdon', // 449
  'Skorupi', // 450
  'Drapion', // 451
  'Croagunk', // 452
  'Toxicroak', // 453
  'Carnivine', // 454
  'Finneon', // 455
  'Lumineon', // 456
  'Mantyke', // 457
  'Snover', // 458
  'Abomasnow', // 459
  'Weavile', // 460
  'Magnezone', // 461
  'Lickilicky', // 462
  'Rhyperior', // 463
  'Tangrowth', // 464
  'Electivire', // 465
  'Magmortar', // 466
  'Togekiss', // 467
  'Yanmega', // 468
  'Leafeon', // 469
  'Glaceon', // 470
  'Gliscor', // 471
  'Mamoswine', // 472
  'Porygon-Z', // 473
  'Gallade', // 474
  'Probopass', // 475
  'Dusknoir', // 476
  'Froslass', // 477
  'Rotom', // 478
  'Uxie', // 479
  'Mesprit', // 480
  'Azelf', // 481
  'Dialga', // 482
  'Palkia', // 483
  'Heatran', // 484
  'Regigigas', // 485
  'Giratina', // 486
  'Cresselia', // 487
  'Phione', // 488
  'Manaphy', // 489
  'Darkrai', // 490
  'Shaymin', // 491
  'Arceus', // 492
  'Victini', // 493
  'Snivy', // 494
  'Servine', // 495
  'Serperior', // 496
  'Tepig', // 497
  'Pignite', // 498
  'Emboar', // 499
  'Oshawott', // 500
  'Dewott', // 501
  'Samurott', // 502
  'Patrat', // 503
  'Watchog', // 504
  'Lillipup', // 505
  'Herdier', // 506
  'Stoutland', // 507
  'Purrloin', // 508
  'Liepard', // 509
  'Pansage', // 510
  'Simisage', // 511
  'Pansear', // 512
  'Simisear', // 513
  'Panpour', // 514
  'Simipour', // 515
  'Munna', // 516
  'Musharna', // 517
  'Pidove', // 518
  'Tranquill', // 519
  'Unfezant', // 520
  'Blitzle', // 521
  'Zebstrika', // 522
  'Roggenrola', // 523
  'Boldore', // 524
  'Gigalith', // 525
  'Woobat', // 526
  'Swoobat', // 527
  'Drilbur', // 528
  'Excadrill', // 529
  'Audino', // 530
  'Timburr', // 531
  'Gurdurr', // 532
  'Conkeldurr', // 533
  'Tympole', // 534
  'Palpitoad', // 535
  'Seismitoad', // 536
  'Throh', // 537
  'Sawk', // 538
  'Sewaddle', // 539
  'Swadloon', // 540
  'Leavanny', // 541
  'Venipede', // 542
  'Whirlipede', // 543
  'Scolipede', // 544
  'Cottonee', // 545
  'Whimsicott', // 546
  'Petilil', // 547
  'Lilligant', // 548
  'Basculin', // 549
  'Sandile', // 550
  'Krokorok', // 551
  'Krookodile', // 552
  'Darumaka', // 553
  'Darmanitan', // 554
  'Maractus', // 555
  'Dwebble', // 556
  'Crustle', // 557
  'Scraggy', // 558
  'Scrafty', // 559
  'Sigilyph', // 560
  'Yamask', // 561
  'Cofagrigus', // 562
  'Tirtouga', // 563
  'Carracosta', // 564
  'Archen', // 565
  'Archeops', // 566
  'Trubbish', // 567
  'Garbodor', // 568
  'Zorua', // 569
  'Zoroark', // 570
  'Minccino', // 571
  'Cinccino', // 572
  'Gothita', // 573
  'Gothorita', // 574
  'Gothitelle', // 575
  'Solosis', // 576
  'Duosion', // 577
  'Reuniclus', // 578
  'Ducklett', // 579
  'Swanna', // 580
  'Vanillite', // 581
  'Vanillish', // 582
  'Vanilluxe', // 583
  'Deerling', // 584
  'Sawsbuck', // 585
  'Emolga', // 586
  'Karrablast', // 587
  'Escavalier', // 588
  'Foongus', // 589
  'Amoonguss', // 590
  'Frillish', // 591
  'Jellicent', // 592
  'Alomomola', // 593
  'Joltik', // 594
  'Galvantula', // 595
  'Ferroseed', // 596
  'Ferrothorn', // 597
  'Klink', // 598
  'Klang', // 599
  'Klinklang', // 600
  'Tynamo', // 601
  'Eelektrik', // 602
  'Eelektross', // 603
  'Elgyem', // 604
  'Beheeyem', // 605
  'Litwick', // 606
  'Lampent', // 607
  'Chandelure', // 608
  'Axew', // 609
  'Fraxure', // 610
  'Haxorus', // 611
  'Cubchoo', // 612
  'Beartic', // 613
  'Cryogonal', // 614
  'Shelmet', // 615
  'Accelgor', // 616
  'Stunfisk', // 617
  'Mienfoo', // 618
  'Mienshao', // 619
  'Druddigon', // 620
  'Golett', // 621
  'Golurk', // 622
  'Pawniard', // 623
  'Bisharp', // 624
  'Bouffalant', // 625
  'Rufflet', // 626
  'Braviary', // 627
  'Vullaby', // 628
  'Mandibuzz', // 629
  'Heatmor', // 630
  'Durant', // 631
  'Deino', // 632
  'Zweilous', // 633
  'Hydreigon', // 634
  'Larvesta', // 635
  'Volcarona', // 636
  'Cobalion', // 637
  'Terrakion', // 638
  'Virizion', // 639
  'Tornadus', // 640
  'Thundurus', // 641
  'Reshiram', // 642
  'Zekrom', // 643
  'Landorus', // 644
  'Kyurem', // 645
  'Keldeo', // 646
  'Meloetta', // 647
  'Genesect', // 648
  'Chespin', // 649
  'Quilladin', // 650
  'Chesnaught', // 651
  'Fennekin', // 652
  'Braixen', // 653
  'Delphox', // 654
  'Froakie', // 655
  'Frogadier', // 656
  'Greninja', // 657
  'Bunnelby', // 658
  'Diggersby', // 659
  'Fletchling', // 660
  'Fletchinder', // 661
  'Talonflame', // 662
  'Scatterbug', // 663
  'Spewpa', // 664
  'Vivillon', // 665
  'Litleo', // 666
  'Pyroar', // 667
  'Flabébé', // 668
  'Floette', // 669
  'Florges', // 670
  'Skiddo', // 671
  'Gogoat', // 672
  'Pancham', // 673
  'Pangoro', // 674
  'Furfrou', // 675
  'Espurr', // 676
  'Meowstic', // 677
  'Honedge', // 678
  'Doublade', // 679
  'Aegislash-Both', // 680
  'Spritzee', // 681
  'Aromatisse', // 682
  'Swirlix', // 683
  'Slurpuff', // 684
  'Inkay', // 685
  'Malamar', // 686
  'Binacle', // 687
  'Barbaracle', // 688
  'Skrelp', // 689
  'Dragalge', // 690
  'Clauncher', // 691
  'Clawitzer', // 692
  'Helioptile', // 693
  'Heliolisk', // 694
  'Tyrunt', // 695
  'Tyrantrum', // 696
  'Amaura', // 697
  'Aurorus', // 698
  'Sylveon', // 699
  'Hawlucha', // 700
  'Dedenne', // 701
  'Carbink', // 702
  'Goomy', // 703
  'Sliggoo', // 704
  'Goodra', // 705
  'Klefki', // 706
  'Phantump', // 707
  'Trevenant', // 708
  'Pumpkaboo', // 709
  'Gourgeist', // 710
  'Bergmite', // 711
  'Avalugg', // 712
  'Noibat', // 713
  'Noivern', // 714
  'Xerneas', // 715
  'Yveltal', // 716
  'Zygarde', // 717
  'Diancie', // 718
  'Hoopa', // 719
  'Volcanion', // 720
  'Rowlet', // 721
  'Dartrix', // 722
  'Decidueye', // 723
  'Litten', // 724
  'Torracat', // 725
  'Incineroar', // 726
  'Popplio', // 727
  'Brionne', // 728
  'Primarina', // 729
  'Pikipek', // 730
  'Trumbeak', // 731
  'Toucannon', // 732
  'Yungoos', // 733
  'Gumshoos', // 734
  'Grubbin', // 735
  'Charjabug', // 736
  'Vikavolt', // 737
  'Crabrawler', // 738
  'Crabominable', // 739
  'Oricorio', // 740
  'Cutiefly', // 741
  'Ribombee', // 742
  'Rockruff', // 743
  'Lycanroc', // 744
  'Wishiwashi', // 745
  'Mareanie', // 746
  'Toxapex', // 747
  'Mudbray', // 748
  'Mudsdale', // 749
  'Dewpider', // 750
  'Araquanid', // 751
  'Fomantis', // 752
  'Lurantis', // 753
  'Morelull', // 754
  'Shiinotic', // 755
  'Salandit', // 756
  'Salazzle', // 757
  'Stufful', // 758
  'Bewear', // 759
  'Bounsweet', // 760
  'Steenee', // 761
  'Tsareena', // 762
  'Comfey', // 763
  'Oranguru', // 764
  'Passimian', // 765
  'Wimpod', // 766
  'Golisopod', // 767
  'Sandygast', // 768
  'Palossand', // 769
  'Pyukumuku', // 770
  'Type: Null', // 771
  'Silvally', // 772
  'Minior', // 773
  'Komala', // 774
  'Turtonator', // 775
  'Togedemaru', // 776
  'Mimikyu', // 777
  'Bruxish', // 778
  'Drampa', // 779
  'Dhelmise', // 780
  'Jangmo-o', // 781
  'Hakamo-o', // 782
  'Kommo-o', // 783
  'Tapu Koko', // 784
  'Tapu Lele', // 785
  'Tapu Bulu', // 786
  'Tapu Fini', // 787
  'Cosmog', // 788
  'Cosmoem', // 789
  'Solgaleo', // 790
  'Lunala', // 791
  'Nihilego', // 792
  'Buzzwole', // 793
  'Pheromosa', // 794
  'Xurkitree', // 795
  'Celesteela', // 796
  'Kartana', // 797
  'Guzzlord', // 798
  'Necrozma', // 799
  'Magearna', // 800
  'Marshadow', // 801
  'Poipole', // 802
  'Naganadel', // 803
  'Stakataka', // 804
  'Blacephalon', // 805
  'Zeraora', // 806
  'Meltan', // 807
  'Melmetal', // 808
  'Grookey', // 809
  'Thwackey', // 810
  'Rillaboom', // 811
  'Scorbunny', // 812
  'Raboot', // 813
  'Cinderace', // 814
  'Sobble', // 815
  'Drizzile', // 816
  'Inteleon', // 817
  'Skwovet', // 818
  'Greedent', // 819
  'Rookidee', // 820
  'Corvisquire', // 821
  'Corviknight', // 822
  'Blipbug', // 823
  'Dottler', // 824
  'Orbeetle', // 825
  'Nickit', // 826
  'Thievul', // 827
  'Gossifleur', // 828
  'Eldegoss', // 829
  'Wooloo', // 830
  'Dubwool', // 831
  'Chewtle', // 832
  'Drednaw', // 833
  'Yamper', // 834
  'Boltund', // 835
  'Rolycoly', // 836
  'Carkol', // 837
  'Coalossal', // 838
  'Applin', // 839
  'Flapple', // 840
  'Appletun', // 841
  'Silicobra', // 842
  'Sandaconda', // 843
  'Cramorant', // 844
  'Arrokuda', // 845
  'Barraskewda', // 846
  'Toxel', // 847
  'Toxtricity', // 848
  'Sizzlipede', // 849
  'Centiskorch', // 850
  'Clobbopus', // 851
  'Grapploct', // 852
  'Sinistea', // 853
  'Polteageist', // 854
  'Hatenna', // 855
  'Hattrem', // 856
  'Hatterene', // 857
  'Impidimp', // 858
  'Morgrem', // 859
  'Grimmsnarl', // 860
  'Obstagoon', // 861
  'Perrserker', // 862
  'Cursola', // 863
  'Sirfetch’d', // 864
  'Mr. Rime', // 865
  'Runerigus', // 866
  'Milcery', // 867
  'Alcremie', // 868
  'Falinks', // 869
  'Pincurchin', // 870
  'Snom', // 871
  'Frosmoth', // 872
  'Stonjourner', // 873
  'Eiscue', // 874
  'Indeedee', // 875
  'Morpeko', // 876
  'Cufant', // 877
  'Copperajah', // 878
  'Dracozolt', // 879
  'Arctozolt', // 880
  'Dracovish', // 881
  'Arctovish', // 882
  'Duraludon', // 883
  'Dreepy', // 884
  'Drakloak', // 885
  'Dragapult', // 886
  'Zacian', // 887
  'Zamazenta', // 888
  'Eternatus', // 889
  'Kubfu', // 890
  'Urshifu', // 891
  'Zarude', // 892
  'Regieleki', // 893
  'Regidrago', // 894
  'Glastrier', // 895
  'Spectrier', // 896
  'Calyrex', // 897
  'Wyrdeer', // 898
  'Kleavor', // 899
  'Ursaluna', // 900
  'Basculegion', // 901
  'Sneasler', // 902
  'Overqwil', // 903
  'Enamorus', // 904
  'Sprigatito', // 905
  'Floragato', // 906
  'Meowscarada', // 907
  'Fuecoco', // 908
  'Crocalor', // 909
  'Skeledirge', // 910
  'Quaxly', // 911
  'Quaxwell', // 912
  'Quaquaval', // 913
  'Lechonk', // 914
  'Oinkologne', // 915
  'Tarountula', // 916
  'Spidops', // 917
  'Nymble', // 918
  'Lokix', // 919
  'Pawmi', // 920
  'Pawmo', // 921
  'Pawmot', // 922
  'Tandemaus', // 923
  'Maushold', // 924
  'Fidough', // 925
  'Dachsbun', // 926
  'Smoliv', // 927
  'Dolliv', // 928
  'Arboliva', // 929
  'Squawkabilly', // 930
  'Nacli', // 931
  'Naclstack', // 932
  'Garganacl', // 933
  'Charcadet', // 934
  'Armarouge', // 935
  'Ceruledge', // 936
  'Tadbulb', // 937
  'Bellibolt', // 938
  'Wattrel', // 939
  'Kilowattrel', // 940
  'Maschiff', // 941
  'Mabosstiff', // 942
  'Shroodle', // 943
  'Grafaiai', // 944
  'Bramblin', // 945
  'Brambleghast', // 946
  'Toedscool', // 947
  'Toedscruel', // 948
  'Klawf', // 949
  'Capsakid', // 950
  'Scovillain', // 951
  'Rellor', // 952
  'Rabsca', // 953
  'Flittle', // 954
  'Espathra', // 955
  'Tinkatink', // 956
  'Tinkatuff', // 957
  'Tinkaton', // 958
  'Wiglett', // 959
  'Wugtrio', // 960
  'Bombirdier', // 961
  'Finizen', // 962
  'Palafin', // 963
  'Varoom', // 964
  'Revavroom', // 965
  'Cyclizar', // 966
  'Orthworm', // 967
  'Glimmet', // 968
  'Glimmora', // 969
  'Greavard', // 970
  'Houndstone', // 971
  'Flamigo', // 972
  'Cetoddle', // 973
  'Cetitan', // 974
  'Veluza', // 975
  'Dondozo', // 976
  'Tatsugiri', // 977
  'Annihilape', // 978
  'Clodsire', // 979
  'Farigiraf', // 980
  'Dudunsparce', // 981
  'Kingambit', // 982
  'Great Tusk', // 983
  'Scream Tail', // 984
  'Brute Bonnet', // 985
  'Flutter Mane', // 986
  'Slither Wing', // 987
  'Sandy Shocks', // 988
  'Iron Treads', // 989
  'Iron Bundle', // 990
  'Iron Hands', // 991
  'Iron Jugulis', // 992
  'Iron Moth', // 993
  'Iron Thorns', // 994
  'Frigibax', // 995
  'Arctibax', // 996
  'Baxcalibur', // 997
  'Gimmighoul', // 998
  'Gholdengo', // 999
  'Wo-Chien', // 1000
  'Chien-Pao', // 1001
  'Ting-Lu', // 1002
  'Chi-Yu', // 1003
  'Roaring Moon', // 1004
  'Iron Valiant', // 1005
  'Koraidon', // 1006
  'Miraidon', // 1007
  'Walking Wake', // 1008
  'Iron Leaves', // 1009
  'Dipplin', // 1010
  'Poltchageist', // 1011
  'Sinistcha', // 1012
  'Okidogi', // 1013
  'Munkidori', // 1014
  'Fezandipiti', // 1015
  'Ogerpon', // 1016
  'Archaludon', // 1017
  'Hydrapple', // 1018
  'Gouging-Fire', // 1019
  'Raging-Bolt', // 1020
  'Iron-Boulder', // 1021
  'Iron-Crown', // 1022
  'Terapagos', // 1023
  'Pecharunt', // 1024
  'Venusaur-Mega', // 1025
  'Charizard-Mega-X', // 1026
  'Charizard-Mega-Y', // 1027
  'Blastoise-Mega', // 1028
  'Beedrill-Mega', // 1029
  'Pidgeot-Mega', // 1030
  'Alakazam-Mega', // 1031
  'Slowbro-Mega', // 1032
  'Gengar-Mega', // 1033
  'Kangaskhan-Mega', // 1034
  'Pinsir-Mega', // 1035
  'Gyarados-Mega', // 1036
  'Aerodactyl-Mega', // 1037
  'Mewtwo-Mega-X', // 1038
  'Mewtwo-Mega-Y', // 1039
  'Ampharos-Mega', // 1040
  'Steelix-Mega', // 1041
  'Scizor-Mega', // 1042
  'Heracross-Mega', // 1043
  'Houndoom-Mega', // 1044
  'Tyranitar-Mega', // 1045
  'Sceptile-Mega', // 1046
  'Blaziken-Mega', // 1047
  'Swampert-Mega', // 1048
  'Gardevoir-Mega', // 1049
  'Sableye-Mega', // 1050
  'Mawile-Mega', // 1051
  'Aggron-Mega', // 1052
  'Medicham-Mega', // 1053
  'Manectric-Mega', // 1054
  'Sharpedo-Mega', // 1055
  'Camerupt-Mega', // 1056
  'Altaria-Mega', // 1057
  'Banette-Mega', // 1058
  'Absol-Mega', // 1059
  'Glalie-Mega', // 1060
  'Salamence-Mega', // 1061
  'Metagross-Mega', // 1062
  'Latias-Mega', // 1063
  'Latios-Mega', // 1064
  'Lopunny-Mega', // 1065
  'Garchomp-Mega', // 1066
  'Lucario-Mega', // 1067
  'Abomasnow-Mega', // 1068
  'Gallade-Mega', // 1069
  'Audino-Mega', // 1070
  'Diancie-Mega', // 1071
  'Rayquaza-Mega', // 1072
  'Kyogre-Primal', // 1073
  'Groudon-Primal', // 1074
  'Rattata-Alola', // 1075
  'Raticate-Alola', // 1076
  'Raichu-Alola', // 1077
  'Sandshrew-Alola', // 1078
  'Sandslash-Alola', // 1079
  'Vulpix-Alola', // 1080
  'Ninetales-Alola', // 1081
  'Diglett-Alola', // 1082
  'Dugtrio-Alola', // 1083
  'Meowth-Alola', // 1084
  'Persian-Alola', // 1085
  'Geodude-Alola', // 1086
  'Graveler-Alola', // 1087
  'Golem-Alola', // 1088
  'Grimer-Alola', // 1089
  'Muk-Alola', // 1090
  'Exeggutor-Alola', // 1091
  'Marowak-Alola', // 1092
  'Meowth-Galar', // 1093
  'Ponyta-Galar', // 1094
  'Rapidash-Galar', // 1095
  'Slowpoke-Galar', // 1096
  'Slowbro-Galar', // 1097
  'Farfetch’d-Galar', // 1098
  'Weezing-Galar', // 1099
  'Mr. Mime-Galar', // 1100
  'Articuno-Galar', // 1101
  'Zapdos-Galar', // 1102
  'Moltres-Galar', // 1103
  'Slowking-Galar', // 1104
  'Corsola-Galar', // 1105
  'Zigzagoon-Galar', // 1106
  'Linoone-Galar', // 1107
  'Darumaka-Galar', // 1108
  'Darmanitan-Galar', // 1109
  'Yamask-Galar', // 1110
  'Stunfisk-Galar', // 1111
  'Growlithe-Hisui', // 1112
  'Arcanine-Hisui', // 1113
  'Voltorb-Hisui', // 1114
  'Electrode-Hisui', // 1115
  'Typhlosion-Hisui', // 1116
  'Qwilfish-Hisui', // 1117
  'Sneasel-Hisui', // 1118
  'Samurott-Hisui', // 1119
  'Lilligant-Hisui', // 1120
  'Zorua-Hisui', // 1121
  'Zoroark-Hisui', // 1122
  'Braviary-Hisui', // 1123
  'Sliggoo-Hisui', // 1124
  'Goodra-Hisui', // 1125
  'Avalugg-Hisui', // 1126
  'Decidueye-Hisui', // 1127
  'Wooper-Paldea', // 1128
  'Tauros-Paldea-Combat', // 1129
  'Pikachu-Cosplay', // 1130
  'Pikachu-Rock-Star', // 1131
  'Pikachu-Belle', // 1132
  'Pikachu-Pop-Star', // 1133
  'Pikachu-PhD', // 1134
  'Pikachu-Libre', // 1135
  'Pikachu-Original', // 1136
  'Pikachu-Hoenn', // 1137
  'Pikachu-Sinnoh', // 1138
  'Pikachu-Unova', // 1139
  'Pikachu-Kalos', // 1140
  'Pikachu-Alola', // 1141
  'Pikachu-Partner', // 1142
  'Pikachu-World', // 1143
  'Pichu-Spiky-eared', // 1144
  'Unown', // 1145
  'Unown', // 1146
  'Unown', // 1147
  'Unown', // 1148
  'Unown', // 1149
  'Unown', // 1150
  'Unown', // 1151
  'Unown', // 1152
  'Unown', // 1153
  'Unown', // 1154
  'Unown', // 1155
  'Unown', // 1156
  'Unown', // 1157
  'Unown', // 1158
  'Unown', // 1159
  'Unown', // 1160
  'Unown', // 1161
  'Unown', // 1162
  'Unown', // 1163
  'Unown', // 1164
  'Unown', // 1165
  'Unown', // 1166
  'Unown', // 1167
  'Unown', // 1168
  'Unown', // 1169
  'Unown', // 1170
  'Unown', // 1171
  'Castform-Sunny', // 1172
  'Castform-Rainy', // 1173
  'Castform-Snowy', // 1174
  'Deoxys-Attack', // 1175
  'Deoxys-Defense', // 1176
  'Deoxys-Speed', // 1177
  'Burmy', // 1178
  'Burmy', // 1179
  'Wormadam-Sandy', // 1180
  'Wormadam-Trash', // 1181
  'Cherrim-Sunshine', // 1182
  'Shellos', // 1183
  'Gastrodon', // 1184
  'Rotom-Heat', // 1185
  'Rotom-Wash', // 1186
  'Rotom-Frost', // 1187
  'Rotom-Fan', // 1188
  'Rotom-Mow', // 1189
  'Dialga-Origin', // 1190
  'Palkia-Origin', // 1191
  'Giratina-Origin', // 1192
  'Shaymin-Sky', // 1193
  'Arceus-Fighting', // 1194
  'Arceus-Flying', // 1195
  'Arceus-Poison', // 1196
  'Arceus-Ground', // 1197
  'Arceus-Rock', // 1198
  'Arceus-Bug', // 1199
  'Arceus-Ghost', // 1200
  'Arceus-Steel', // 1201
  'Arceus-Fire', // 1202
  'Arceus-Water', // 1203
  'Arceus-Grass', // 1204
  'Arceus-Electric', // 1205
  'Arceus-Psychic', // 1206
  'Arceus-Ice', // 1207
  'Arceus-Dragon', // 1208
  'Arceus-Dark', // 1209
  'Arceus-Fairy', // 1210
  'Basculin-Blue-Striped', // 1211
  'Basculin-White-Striped', // 1212
  'Darmanitan-Zen', // 1213
  'Darmanitan-Galar-Zen', // 1214
  'Deerling', // 1215
  'Deerling', // 1216
  'Deerling', // 1217
  'Sawsbuck', // 1218
  'Sawsbuck', // 1219
  'Sawsbuck', // 1220
  'Tornadus-Therian', // 1221
  'Thundurus-Therian', // 1222
  'Landorus-Therian', // 1223
  'Enamorus-Therian', // 1224
  'Kyurem-White', // 1225
  'Kyurem-Black', // 1226
  'Keldeo-Resolute', // 1227
  'Meloetta-Pirouette', // 1228
  'Genesect-Douse', // 1229
  'Genesect-Shock', // 1230
  'Genesect-Burn', // 1231
  'Genesect-Chill', // 1232
  'Greninja', // 1233
  'Greninja-Ash', // 1234
  'Vivillon', // 1235
  'Vivillon', // 1236
  'Vivillon', // 1237
  'Vivillon', // 1238
  'Vivillon', // 1239
  'Vivillon', // 1240
  'Vivillon', // 1241
  'Vivillon', // 1242
  'Vivillon', // 1243
  'Vivillon', // 1244
  'Vivillon', // 1245
  'Vivillon', // 1246
  'Vivillon', // 1247
  'Vivillon', // 1248
  'Vivillon', // 1249
  'Vivillon', // 1250
  'Vivillon', // 1251
  'Vivillon', // 1252
  'Vivillon', // 1253
  'Flabébé', // 1254
  'Flabébé', // 1255
  'Flabébé', // 1256
  'Flabébé', // 1257
  'Floette', // 1258
  'Floette', // 1259
  'Floette', // 1260
  'Floette', // 1261
  'Floette-Eternal', // 1262
  'Florges', // 1263
  'Florges', // 1264
  'Florges', // 1265
  'Florges', // 1266
  'Furfrou', // 1267
  'Furfrou', // 1268
  'Furfrou', // 1269
  'Furfrou', // 1270
  'Furfrou', // 1271
  'Furfrou', // 1272
  'Furfrou', // 1273
  'Furfrou', // 1274
  'Furfrou', // 1275
  'Meowstic-F', // 1276
  'Aegislash-Blade', // 1277
  'Pumpkaboo-Small', // 1278
  'Pumpkaboo-Large', // 1279
  'Pumpkaboo-Super', // 1280
  'Gourgeist-Small', // 1281
  'Gourgeist-Large', // 1282
  'Gourgeist-Super', // 1283
  'Xerneas', // 1284
  'Zygarde-10', // 1285
  'Zygarde-10', // 1286
  'Zygarde', // 1287
  'Zygarde-Complete', // 1288
  'Hoopa-Unbound', // 1289
  'Oricorio-Pom-Pom', // 1290
  'Oricorio-Pa\'u ', // 1291
  'Oricorio-Sensu', // 1292
  'Rockruff', // 1293
  'Lycanroc-Midnight', // 1294
  'Lycanroc-Dusk', // 1295
  'Wishiwashi-School', // 1296
  'Silvally-Fighting', // 1297
  'Silvally-Flying', // 1298
  'Silvally-Poison', // 1299
  'Silvally-Ground', // 1300
  'Silvally-Rock', // 1301
  'Silvally-Bug', // 1302
  'Silvally-Ghost', // 1303
  'Silvally-Steel', // 1304
  'Silvally-Fire', // 1305
  'Silvally-Water', // 1306
  'Silvally-Grass', // 1307
  'Silvally-Electric', // 1308
  'Silvally-Psychic', // 1309
  'Silvally-Ice', // 1310
  'Silvally-Dragon', // 1311
  'Silvally-Dark', // 1312
  'Silvally-Fairy', // 1313
  'Minior', // 1314
  'Minior', // 1315
  'Minior', // 1316
  'Minior', // 1317
  'Minior', // 1318
  'Minior', // 1319
  'Minior', // 1320
  'Minior', // 1321
  'Minior', // 1322
  'Minior', // 1323
  'Minior', // 1324
  'Minior', // 1325
  'Minior', // 1326
  'Mimikyu-Busted', // 1327
  'Necrozma-Dusk-Mane', // 1328
  'Necrozma-Dawn-Wings', // 1329
  'Necrozma-Ultra', // 1330
  'Magearna-Original', // 1331
  'Cramorant-Gulping', // 1332
  'Cramorant-Gorging', // 1333
  'Toxtricity-Low-Key', // 1334
  'Sinistea-Antique', // 1335
  'Polteageist-Antique', // 1336
  'Alcremie', // 1337
  'Alcremie', // 1338
  'Alcremie', // 1339
  'Alcremie', // 1340
  'Alcremie', // 1341
  'Alcremie', // 1342
  'Alcremie', // 1343
  'Alcremie', // 1344
  'Eiscue-Noice', // 1345
  'Indeedee-F', // 1346
  'Morpeko-Hangry', // 1347
  'Zacian-Crowned', // 1348
  'Zamazenta-Crowned', // 1349
  'Eternatus-Eternamax', // 1350
  'Urshifu-Rapid-Strike', // 1351
  'Zarude-Dada', // 1352
  'Calyrex-Ice', // 1353
  'Calyrex-Shadow', // 1354
  'Basculegion-F', // 1355
  'Oinkologne-F', // 1356
  'Maushold-Four', // 1357
  'Squawkabilly-Blue', // 1358
  'Squawkabilly-Yellow', // 1359
  'Squawkabilly-White', // 1360
  'Palafin-Hero', // 1361
  'Tatsugiri', // 1362
  'Tatsugiri', // 1363
  'Dudunsparce-Three-Segment', // 1364
  'Gimmighoul-Roaming', // 1365
  'Tauros-Paldea-Blaze', // 1366
  'Tauros-Paldea-Aqua', // 1367
  'Ogerpon-Wellspring', // 1368
  'Ogerpon-Hearthflame', // 1369
  'Ogerpon-Cornerstone', // 1370
  'Ogerpon-Teal-Tera', // 1371
  'Ogerpon-Wellspring-Tera', // 1372
  'Ogerpon-Hearthflame-Tera', // 1373
  'Ogerpon-Cornerstone-Tera', // 1374
  'Ursaluna-Bloodmoon', // 1375
  'Terapagos-Terastal', // 1376
  'Terapagos-Stellar', // 1377
  'Clefable-Mega', // 1378
  'Victreebel-Mega', // 1379
  'Starmie-Mega', // 1380
  'Dragonite-Mega', // 1381
  'Meganium-Mega', // 1382
  'Feraligatr-Mega', // 1383
  'Skarmory-Mega', // 1384
  'Froslass-Mega', // 1385
  'Emboar-Mega', // 1386
  'Excadrill-Mega', // 1387
  'Scolipede-Mega', // 1388
  'Scrafty-Mega', // 1389
  'Eelektross-Mega', // 1390
  'Chandelure-Mega', // 1391
  'Chesnaught-Mega', // 1392
  'Delphox-Mega', // 1393
  'Greninja-Mega', // 1394
  'Pyroar-Mega', // 1395
  'Floette-Eternal-Mega', // 1396
  'Malamar-Mega', // 1397
  'Barbaracle-Mega', // 1398
  'Dragalge-Mega', // 1399
  'Hawlucha-Mega', // 1400
  'Zygarde-Complete-Mega', // 1401
  'Drampa-Mega', // 1402
  'Falinks-Mega', // 1403
];

export const ITEMS: readonly string[] = [
  'Poke Ball', // 0
  'Great Ball', // 1
  'Ultra Ball', // 2
  'Master Ball', // 3
  'Premier Ball', // 4
  'Heal Ball', // 5
  'Net Ball', // 6
  'Nest Ball', // 7
  'Dive Ball', // 8
  'Dusk Ball', // 9
  'Timer Ball', // 10
  'Quick Ball', // 11
  'Repeat Ball', // 12
  'Luxury Ball', // 13
  'Level Ball', // 14
  'Lure Ball', // 15
  'Moon Ball', // 16
  'Friend Ball', // 17
  'Love Ball', // 18
  'Fast Ball', // 19
  'Heavy Ball', // 20
  'Dream Ball', // 21
  'Safari Ball', // 22
  'Sport Ball', // 23
  'Park Ball', // 24
  'Beast Ball', // 25
  'Cherish Ball', // 26
  'Poke Ball', // 27
  'Poke Ball', // 28
  'Poke Ball', // 29
  'Poke Ball', // 30
  'Poke Ball', // 31
  'Poke Ball', // 32
  'Poke Ball', // 33
  'Poke Ball', // 34
  'Poke Ball', // 35
  'Poke Ball', // 36
  'Poke Ball', // 37
  'Poke Ball', // 38
  'Poke Ball', // 39
  'Poke Ball', // 40
  'Poke Ball', // 41
  'Poke Ball', // 42
  'Poke Ball', // 43
  'Poke Ball', // 44
  'Poke Ball', // 45
  'Poke Ball', // 46
  'Poke Ball', // 47
  'Poke Ball', // 48
  'Poke Ball', // 49
  'Poke Ball', // 50
  'Poke Ball', // 51
  'Berry Juice', // 52
  'Poke Ball', // 53
  'Poke Ball', // 54
  'Poke Ball', // 55
  'Poke Ball', // 56
  'Poke Ball', // 57
  'Poke Ball', // 58
  'Poke Ball', // 59
  'Poke Ball', // 60
  'Poke Ball', // 61
  'Poke Ball', // 62
  'Poke Ball', // 63
  'Poke Ball', // 64
  'Poke Ball', // 65
  'Poke Ball', // 66
  'Poke Ball', // 67
  'Poke Ball', // 68
  'Poke Ball', // 69
  'Poke Ball', // 70
  'Poke Ball', // 71
  'Poke Ball', // 72
  'Poke Ball', // 73
  'Poke Ball', // 74
  'Poke Ball', // 75
  'Poke Ball', // 76
  'Poke Ball', // 77
  'Poke Ball', // 78
  'Poke Ball', // 79
  'Poke Ball', // 80
  'Poke Ball', // 81
  'Poke Ball', // 82
  'Poke Ball', // 83
  'Poke Ball', // 84
  'Poke Ball', // 85
  'Poke Ball', // 86
  'Poke Ball', // 87
  'Poke Ball', // 88
  'Poke Ball', // 89
  'Poke Ball', // 90
  'Poke Ball', // 91
  'Poke Ball', // 92
  'Poke Ball', // 93
  'Poke Ball', // 94
  'Poke Ball', // 95
  'Poke Ball', // 96
  'Poke Ball', // 97
  'Poke Ball', // 98
  'Poke Ball', // 99
  'Poke Ball', // 100
  'Poke Ball', // 101
  'Poke Ball', // 102
  'Poke Ball', // 103
  'Poke Ball', // 104
  'Poke Ball', // 105
  'Poke Ball', // 106
  'Poke Ball', // 107
  'Poke Ball', // 108
  'Poke Ball', // 109
  'Poke Ball', // 110
  'Poke Ball', // 111
  'Poke Ball', // 112
  'Poke Ball', // 113
  'Poke Ball', // 114
  'Poke Ball', // 115
  'Poke Ball', // 116
  'Poke Ball', // 117
  'Poke Ball', // 118
  'Poke Ball', // 119
  'Poke Ball', // 120
  'Poke Ball', // 121
  'Poke Ball', // 122
  'Poke Ball', // 123
  'Poke Ball', // 124
  'Poke Ball', // 125
  'Poke Ball', // 126
  'Poke Ball', // 127
  'Poke Ball', // 128
  'Poke Ball', // 129
  'Poke Ball', // 130
  'Poke Ball', // 131
  'Bottle Cap', // 132
  'Poke Ball', // 133
  'Poke Ball', // 134
  'Poke Ball', // 135
  'Poke Ball', // 136
  'Poke Ball', // 137
  'Poke Ball', // 138
  'Poke Ball', // 139
  'Poke Ball', // 140
  'Poke Ball', // 141
  'Poke Ball', // 142
  'Poke Ball', // 143
  'Poke Ball', // 144
  'Poke Ball', // 145
  'Poke Ball', // 146
  'Poke Ball', // 147
  'Poke Ball', // 148
  'Poke Ball', // 149
  'Poke Ball', // 150
  'Poke Ball', // 151
  'Poke Ball', // 152
  'Rare Bone', // 153
  'Poke Ball', // 154
  'Poke Ball', // 155
  'Poke Ball', // 156
  'Poke Ball', // 157
  'Poke Ball', // 158
  'Poke Ball', // 159
  'Poke Ball', // 160
  'Poke Ball', // 161
  'Poke Ball', // 162
  'Poke Ball', // 163
  'Helix Fossil', // 164
  'Dome Fossil', // 165
  'Old Amber', // 166
  'Root Fossil', // 167
  'Claw Fossil', // 168
  'Armor Fossil', // 169
  'Skull Fossil', // 170
  'Cover Fossil', // 171
  'Plume Fossil', // 172
  'Jaw Fossil', // 173
  'Sail Fossil', // 174
  'Fossilized Bird', // 175
  'Fossilized Fish', // 176
  'Fossilized Drake', // 177
  'Fossilized Dino', // 178
  'Poke Ball', // 179
  'Poke Ball', // 180
  'Poke Ball', // 181
  'Poke Ball', // 182
  'Poke Ball', // 183
  'Poke Ball', // 184
  'Poke Ball', // 185
  'Poke Ball', // 186
  'Poke Ball', // 187
  'Poke Ball', // 188
  'Poke Ball', // 189
  'Poke Ball', // 190
  'Poke Ball', // 191
  'Poke Ball', // 192
  'Poke Ball', // 193
  'Poke Ball', // 194
  'Poke Ball', // 195
  'Poke Ball', // 196
  'Poke Ball', // 197
  'Mail', // 198
  'Mail', // 199
  'Mail', // 200
  'Mail', // 201
  'Mail', // 202
  'Mail', // 203
  'Mail', // 204
  'Mail', // 205
  'Mail', // 206
  'Mail', // 207
  'Mail', // 208
  'Mail', // 209
  'Fire Stone', // 210
  'Water Stone', // 211
  'Thunder Stone', // 212
  'Leaf Stone', // 213
  'Ice Stone', // 214
  'Sun Stone', // 215
  'Moon Stone', // 216
  'Shiny Stone', // 217
  'Dusk Stone', // 218
  'Dawn Stone', // 219
  'Sweet Apple', // 220
  'Tart Apple', // 221
  'Cracked Pot', // 222
  'Chipped Pot', // 223
  'Galarica Cuff', // 224
  'Galarica Wreath', // 225
  'Dragon Scale', // 226
  'Up-Grade', // 227
  'Protector', // 228
  'Electirizer', // 229
  'Magmarizer', // 230
  'Dubious Disc', // 231
  'Reaper Cloth', // 232
  'Prism Scale', // 233
  'Whipped Dream', // 234
  'Sachet', // 235
  'Oval Stone', // 236
  'Strawberry Sweet', // 237
  'Love Sweet', // 238
  'Berry Sweet', // 239
  'Clover Sweet', // 240
  'Flower Sweet', // 241
  'Star Sweet', // 242
  'Ribbon Sweet', // 243
  'Poke Ball', // 244
  'Poke Ball', // 245
  'Poke Ball', // 246
  'Poke Ball', // 247
  'Poke Ball', // 248
  'Flame Plate', // 249
  'Splash Plate', // 250
  'Zap Plate', // 251
  'Meadow Plate', // 252
  'Icicle Plate', // 253
  'Fist Plate', // 254
  'Toxic Plate', // 255
  'Earth Plate', // 256
  'Sky Plate', // 257
  'Mind Plate', // 258
  'Insect Plate', // 259
  'Stone Plate', // 260
  'Spooky Plate', // 261
  'Draco Plate', // 262
  'Dread Plate', // 263
  'Iron Plate', // 264
  'Pixie Plate', // 265
  'Douse Drive', // 266
  'Shock Drive', // 267
  'Burn Drive', // 268
  'Chill Drive', // 269
  'Fire Memory', // 270
  'Water Memory', // 271
  'Electric Memory', // 272
  'Grass Memory', // 273
  'Ice Memory', // 274
  'Fighting Memory', // 275
  'Poison Memory', // 276
  'Ground Memory', // 277
  'Flying Memory', // 278
  'Psychic Memory', // 279
  'Bug Memory', // 280
  'Rock Memory', // 281
  'Ghost Memory', // 282
  'Dragon Memory', // 283
  'Dark Memory', // 284
  'Steel Memory', // 285
  'Fairy Memory', // 286
  'Rusted Sword', // 287
  'Rusted Shield', // 288
  'Red Orb', // 289
  'Blue Orb', // 290
  'Venusaurite', // 291
  'Charizardite X', // 292
  'Charizardite Y', // 293
  'Blastoisinite', // 294
  'Beedrillite', // 295
  'Pidgeotite', // 296
  'Alakazite', // 297
  'Slowbronite', // 298
  'Gengarite', // 299
  'Kangaskhanite', // 300
  'Pinsirite', // 301
  'Gyaradosite', // 302
  'Aerodactylite', // 303
  'Mewtwonite X', // 304
  'Mewtwonite Y', // 305
  'Ampharosite', // 306
  'Steelixite', // 307
  'Scizorite', // 308
  'Heracronite', // 309
  'Houndoominite', // 310
  'Tyranitarite', // 311
  'Sceptilite', // 312
  'Blazikenite', // 313
  'Swampertite', // 314
  'Gardevoirite', // 315
  'Sablenite', // 316
  'Mawilite', // 317
  'Aggronite', // 318
  'Medichamite', // 319
  'Manectite', // 320
  'Sharpedonite', // 321
  'Cameruptite', // 322
  'Altarianite', // 323
  'Banettite', // 324
  'Absolite', // 325
  'Glalitite', // 326
  'Salamencite', // 327
  'Metagrossite', // 328
  'Latiasite', // 329
  'Latiosite', // 330
  'Lopunnite', // 331
  'Garchompite', // 332
  'Lucarionite', // 333
  'Abomasite', // 334
  'Galladite', // 335
  'Audinite', // 336
  'Diancite', // 337
  'Normal Gem', // 338
  'Fire Gem', // 339
  'Water Gem', // 340
  'Electric Gem', // 341
  'Grass Gem', // 342
  'Ice Gem', // 343
  'Fighting Gem', // 344
  'Poison Gem', // 345
  'Ground Gem', // 346
  'Flying Gem', // 347
  'Psychic Gem', // 348
  'Bug Gem', // 349
  'Rock Gem', // 350
  'Ghost Gem', // 351
  'Dragon Gem', // 352
  'Dark Gem', // 353
  'Steel Gem', // 354
  'Fairy Gem', // 355
  'Normalium Z', // 356
  'Firium Z', // 357
  'Waterium Z', // 358
  'Electrium Z', // 359
  'Grassium Z', // 360
  'Icium Z', // 361
  'Fightinium Z', // 362
  'Poisonium Z', // 363
  'Groundium Z', // 364
  'Flyinium Z', // 365
  'Psychium Z', // 366
  'Buginium Z', // 367
  'Rockium Z', // 368
  'Ghostium Z', // 369
  'Dragonium Z', // 370
  'Darkinium Z', // 371
  'Steelium Z', // 372
  'Fairium Z', // 373
  'Pikanium Z', // 374
  'Eevium Z', // 375
  'Snorlium Z', // 376
  'Mewnium Z', // 377
  'Decidium Z', // 378
  'Incinium Z', // 379
  'Primarium Z', // 380
  'Lycanium Z', // 381
  'Mimikium Z', // 382
  'Kommonium Z', // 383
  'Tapunium Z', // 384
  'Solganium Z', // 385
  'Lunalium Z', // 386
  'Marshadium Z', // 387
  'Aloraichium Z', // 388
  'Pikashunium Z', // 389
  'Ultranecrozium Z', // 390
  'Light Ball', // 391
  'Leek', // 392
  'Thick Club', // 393
  'Lucky Punch', // 394
  'Metal Powder', // 395
  'Quick Powder', // 396
  'Deep Sea Scale', // 397
  'Deep Sea Tooth', // 398
  'Soul Dew', // 399
  'Adamant Orb', // 400
  'Lustrous Orb', // 401
  'Griseous Orb', // 402
  'Sea Incense', // 403
  'Lax Incense', // 404
  'Odd Incense', // 405
  'Rock Incense', // 406
  'Full Incense', // 407
  'Wave Incense', // 408
  'Rose Incense', // 409
  'Poke Ball', // 410
  'Poke Ball', // 411
  'Poke Ball', // 412
  'Poke Ball', // 413
  'Poke Ball', // 414
  'Poke Ball', // 415
  'Poke Ball', // 416
  'Macho Brace', // 417
  'Power Weight', // 418
  'Power Bracer', // 419
  'Power Belt', // 420
  'Power Lens', // 421
  'Power Band', // 422
  'Power Anklet', // 423
  'Silk Scarf', // 424
  'Charcoal', // 425
  'Mystic Water', // 426
  'Magnet', // 427
  'Miracle Seed', // 428
  'Never-Melt Ice', // 429
  'Black Belt', // 430
  'Poison Barb', // 431
  'Soft Sand', // 432
  'Sharp Beak', // 433
  'Twisted Spoon', // 434
  'Silver Powder', // 435
  'Hard Stone', // 436
  'Spell Tag', // 437
  'Dragon Fang', // 438
  'Black Glasses', // 439
  'Metal Coat', // 440
  'Choice Band', // 441
  'Choice Specs', // 442
  'Choice Scarf', // 443
  'Flame Orb', // 444
  'Toxic Orb', // 445
  'Damp Rock', // 446
  'Heat Rock', // 447
  'Smooth Rock', // 448
  'Icy Rock', // 449
  'Electric Seed', // 450
  'Psychic Seed', // 451
  'Misty Seed', // 452
  'Grassy Seed', // 453
  'Absorb Bulb', // 454
  'Cell Battery', // 455
  'Luminous Moss', // 456
  'Snowball', // 457
  'Bright Powder', // 458
  'White Herb', // 459
  'Poke Ball', // 460
  'Quick Claw', // 461
  'Poke Ball', // 462
  'Mental Herb', // 463
  'King\'s Rock', // 464
  'Poke Ball', // 465
  'Poke Ball', // 466
  'Poke Ball', // 467
  'Focus Band', // 468
  'Poke Ball', // 469
  'Scope Lens', // 470
  'Leftovers', // 471
  'Shell Bell', // 472
  'Wide Lens', // 473
  'Muscle Band', // 474
  'Wise Glasses', // 475
  'Expert Belt', // 476
  'Light Clay', // 477
  'Life Orb', // 478
  'Power Herb', // 479
  'Focus Sash', // 480
  'Zoom Lens', // 481
  'Metronome', // 482
  'Iron Ball', // 483
  'Lagging Tail', // 484
  'Destiny Knot', // 485
  'Black Sludge', // 486
  'Grip Claw', // 487
  'Sticky Barb', // 488
  'Shed Shell', // 489
  'Big Root', // 490
  'Razor Claw', // 491
  'Razor Fang', // 492
  'Eviolite', // 493
  'Float Stone', // 494
  'Rocky Helmet', // 495
  'Air Balloon', // 496
  'Red Card', // 497
  'Ring Target', // 498
  'Binding Band', // 499
  'Eject Button', // 500
  'Weakness Policy', // 501
  'Assault Vest', // 502
  'Safety Goggles', // 503
  'Adrenaline Orb', // 504
  'Terrain Extender', // 505
  'Protective Pads', // 506
  'Throat Spray', // 507
  'Eject Pack', // 508
  'Heavy-Duty Boots', // 509
  'Blunder Policy', // 510
  'Room Service', // 511
  'Utility Umbrella', // 512
  'Cheri Berry', // 513
  'Chesto Berry', // 514
  'Pecha Berry', // 515
  'Rawst Berry', // 516
  'Aspear Berry', // 517
  'Leppa Berry', // 518
  'Oran Berry', // 519
  'Persim Berry', // 520
  'Lum Berry', // 521
  'Sitrus Berry', // 522
  'Figy Berry', // 523
  'Wiki Berry', // 524
  'Mago Berry', // 525
  'Aguav Berry', // 526
  'Iapapa Berry', // 527
  'Razz Berry', // 528
  'Bluk Berry', // 529
  'Nanab Berry', // 530
  'Wepear Berry', // 531
  'Pinap Berry', // 532
  'Pomeg Berry', // 533
  'Kelpsy Berry', // 534
  'Qualot Berry', // 535
  'Hondew Berry', // 536
  'Grepa Berry', // 537
  'Tamato Berry', // 538
  'Cornn Berry', // 539
  'Magost Berry', // 540
  'Rabuta Berry', // 541
  'Nomel Berry', // 542
  'Spelon Berry', // 543
  'Pamtre Berry', // 544
  'Watmel Berry', // 545
  'Durin Berry', // 546
  'Belue Berry', // 547
  'Chilan Berry', // 548
  'Occa Berry', // 549
  'Passho Berry', // 550
  'Wacan Berry', // 551
  'Rindo Berry', // 552
  'Yache Berry', // 553
  'Chople Berry', // 554
  'Kebia Berry', // 555
  'Shuca Berry', // 556
  'Coba Berry', // 557
  'Payapa Berry', // 558
  'Tanga Berry', // 559
  'Charti Berry', // 560
  'Kasib Berry', // 561
  'Haban Berry', // 562
  'Colbur Berry', // 563
  'Babiri Berry', // 564
  'Roseli Berry', // 565
  'Liechi Berry', // 566
  'Ganlon Berry', // 567
  'Salac Berry', // 568
  'Petaya Berry', // 569
  'Apicot Berry', // 570
  'Lansat Berry', // 571
  'Starf Berry', // 572
  'Enigma Berry', // 573
  'Micle Berry', // 574
  'Custap Berry', // 575
  'Jaboca Berry', // 576
  'Rowap Berry', // 577
  'Kee Berry', // 578
  'Maranga Berry', // 579
  'Poke Ball', // 580
  'Poke Ball', // 581
  'Poke Ball', // 582
  'Poke Ball', // 583
  'Poke Ball', // 584
  'Poke Ball', // 585
  'Poke Ball', // 586
  'Poke Ball', // 587
  'Poke Ball', // 588
  'Poke Ball', // 589
  'Poke Ball', // 590
  'Poke Ball', // 591
  'Poke Ball', // 592
  'Poke Ball', // 593
  'Poke Ball', // 594
  'Poke Ball', // 595
  'Poke Ball', // 596
  'Poke Ball', // 597
  'Poke Ball', // 598
  'Poke Ball', // 599
  'Poke Ball', // 600
  'Poke Ball', // 601
  'Poke Ball', // 602
  'Poke Ball', // 603
  'Poke Ball', // 604
  'Poke Ball', // 605
  'Poke Ball', // 606
  'Poke Ball', // 607
  'Poke Ball', // 608
  'Poke Ball', // 609
  'Poke Ball', // 610
  'Poke Ball', // 611
  'Poke Ball', // 612
  'Poke Ball', // 613
  'Poke Ball', // 614
  'Poke Ball', // 615
  'Poke Ball', // 616
  'Poke Ball', // 617
  'Poke Ball', // 618
  'Poke Ball', // 619
  'Poke Ball', // 620
  'Poke Ball', // 621
  'Poke Ball', // 622
  'Poke Ball', // 623
  'Poke Ball', // 624
  'Poke Ball', // 625
  'Poke Ball', // 626
  'Poke Ball', // 627
  'Poke Ball', // 628
  'Poke Ball', // 629
  'Poke Ball', // 630
  'Poke Ball', // 631
  'Poke Ball', // 632
  'Poke Ball', // 633
  'Poke Ball', // 634
  'Poke Ball', // 635
  'Poke Ball', // 636
  'Poke Ball', // 637
  'Poke Ball', // 638
  'Poke Ball', // 639
  'Poke Ball', // 640
  'Poke Ball', // 641
  'Poke Ball', // 642
  'Poke Ball', // 643
  'Poke Ball', // 644
  'Poke Ball', // 645
  'Poke Ball', // 646
  'Poke Ball', // 647
  'Poke Ball', // 648
  'Poke Ball', // 649
  'Poke Ball', // 650
  'Poke Ball', // 651
  'Poke Ball', // 652
  'Poke Ball', // 653
  'Poke Ball', // 654
  'Poke Ball', // 655
  'Poke Ball', // 656
  'Poke Ball', // 657
  'Poke Ball', // 658
  'Poke Ball', // 659
  'Poke Ball', // 660
  'Poke Ball', // 661
  'Poke Ball', // 662
  'Poke Ball', // 663
  'Poke Ball', // 664
  'Poke Ball', // 665
  'Poke Ball', // 666
  'Poke Ball', // 667
  'Poke Ball', // 668
  'Poke Ball', // 669
  'Poke Ball', // 670
  'Poke Ball', // 671
  'Poke Ball', // 672
  'Poke Ball', // 673
  'Poke Ball', // 674
  'Poke Ball', // 675
  'Poke Ball', // 676
  'Poke Ball', // 677
  'Poke Ball', // 678
  'Poke Ball', // 679
  'Poke Ball', // 680
  'Poke Ball', // 681
  'Poke Ball', // 682
  'Poke Ball', // 683
  'Poke Ball', // 684
  'Poke Ball', // 685
  'Poke Ball', // 686
  'Poke Ball', // 687
  'Poke Ball', // 688
  'Poke Ball', // 689
  'Poke Ball', // 690
  'Poke Ball', // 691
  'Poke Ball', // 692
  'Poke Ball', // 693
  'Poke Ball', // 694
  'Poke Ball', // 695
  'Poke Ball', // 696
  'Poke Ball', // 697
  'Poke Ball', // 698
  'Poke Ball', // 699
  'Poke Ball', // 700
  'Poke Ball', // 701
  'Poke Ball', // 702
  'Poke Ball', // 703
  'Poke Ball', // 704
  'Poke Ball', // 705
  'Poke Ball', // 706
  'Poke Ball', // 707
  'Poke Ball', // 708
  'Poke Ball', // 709
  'Poke Ball', // 710
  'Poke Ball', // 711
  'Poke Ball', // 712
  'Poke Ball', // 713
  'Poke Ball', // 714
  'Poke Ball', // 715
  'Poke Ball', // 716
  'Poke Ball', // 717
  'Poke Ball', // 718
  'Poke Ball', // 719
  'Poke Ball', // 720
  'Poke Ball', // 721
  'Poke Ball', // 722
  'Poke Ball', // 723
  'Poke Ball', // 724
  'Poke Ball', // 725
  'Poke Ball', // 726
  'Poke Ball', // 727
  'Poke Ball', // 728
  'Poke Ball', // 729
  'Poke Ball', // 730
  'Poke Ball', // 731
  'Poke Ball', // 732
  'Poke Ball', // 733
  'Poke Ball', // 734
  'Poke Ball', // 735
  'Poke Ball', // 736
  'Poke Ball', // 737
  'Poke Ball', // 738
  'Poke Ball', // 739
  'Poke Ball', // 740
  'Poke Ball', // 741
  'Poke Ball', // 742
  'Poke Ball', // 743
  'Poke Ball', // 744
  'Poke Ball', // 745
  'Poke Ball', // 746
  'Poke Ball', // 747
  'Poke Ball', // 748
  'Poke Ball', // 749
  'Poke Ball', // 750
  'Poke Ball', // 751
  'Poke Ball', // 752
  'Poke Ball', // 753
  'Poke Ball', // 754
  'Poke Ball', // 755
  'Poke Ball', // 756
  'Ability Shield', // 757
  'Clear Amulet', // 758
  'Punching Glove', // 759
  'Covert Cloak', // 760
  'Loaded Dice', // 761
  'Auspicious Armor', // 762
  'Booster Energy', // 763
  'Poke Ball', // 764
  'Poke Ball', // 765
  'Poke Ball', // 766
  'Malicious Armor', // 767
  'Mirror Herb', // 768
  'Poke Ball', // 769
  'Poke Ball', // 770
  'Poke Ball', // 771
  'Poke Ball', // 772
  'Poke Ball', // 773
  'Poke Ball', // 774
  'Poke Ball', // 775
  'Poke Ball', // 776
  'Poke Ball', // 777
  'Poke Ball', // 778
  'Poke Ball', // 779
  'Poke Ball', // 780
  'Poke Ball', // 781
  'Poke Ball', // 782
  'Poke Ball', // 783
  'Poke Ball', // 784
  'Poke Ball', // 785
  'Poke Ball', // 786
  'Poke Ball', // 787
  'Poke Ball', // 788
  'Poke Ball', // 789
  'Poke Ball', // 790
  'Poke Ball', // 791
  'Poke Ball', // 792
  'Poke Ball', // 793
  'Black Augurite', // 794
  'Linking Cord', // 795
  'Peat Block', // 796
  'Berserk Gene', // 797
  'Fairy Feather', // 798
  'Syrupy Apple', // 799
  'Poke Ball', // 800
  'Poke Ball', // 801
  'Cornerstone Mask', // 802
  'Wellspring Mask', // 803
  'Hearthflame Mask', // 804
  'Poke Ball', // 805
  'Poke Ball', // 806
  'Poke Ball', // 807
  'Poke Ball', // 808
  'Poke Ball', // 809
  'Poke Ball', // 810
  'Poke Ball', // 811
  'Poke Ball', // 812
  'Poke Ball', // 813
  'Poke Ball', // 814
  'Poke Ball', // 815
  'Poke Ball', // 816
];

export const ABILITIES: readonly string[] = [
  'Stench', // 0
  'Drizzle', // 1
  'Speed Boost', // 2
  'Battle Armor', // 3
  'Sturdy', // 4
  'Damp', // 5
  'Limber', // 6
  'Sand Veil', // 7
  'Static', // 8
  'Volt Absorb', // 9
  'Water Absorb', // 10
  'Oblivious', // 11
  'Cloud Nine', // 12
  'Compound Eyes', // 13
  'Insomnia', // 14
  'Color Change', // 15
  'Immunity', // 16
  'Flash Fire', // 17
  'Shield Dust', // 18
  'Own Tempo', // 19
  'Suction Cups', // 20
  'Intimidate', // 21
  'Shadow Tag', // 22
  'Rough Skin', // 23
  'Wonder Guard', // 24
  'Levitate', // 25
  'Effect Spore', // 26
  'Synchronize', // 27
  'Clear Body', // 28
  'Natural Cure', // 29
  'Lightning Rod', // 30
  'Serene Grace', // 31
  'Swift Swim', // 32
  'Chlorophyll', // 33
  'Illuminate', // 34
  'Trace', // 35
  'Huge Power', // 36
  'Poison Point', // 37
  'Inner Focus', // 38
  'Magma Armor', // 39
  'Water Veil', // 40
  'Magnet Pull', // 41
  'Soundproof', // 42
  'Rain Dish', // 43
  'Sand Stream', // 44
  'Pressure', // 45
  'Thick Fat', // 46
  'Early Bird', // 47
  'Flame Body', // 48
  'Run Away', // 49
  'Keen Eye', // 50
  'Hyper Cutter', // 51
  'Pickup', // 52
  'Truant', // 53
  'Hustle', // 54
  'Cute Charm', // 55
  'Plus', // 56
  'Minus', // 57
  'Forecast', // 58
  'Sticky Hold', // 59
  'Shed Skin', // 60
  'Guts', // 61
  'Marvel Scale', // 62
  'Liquid Ooze', // 63
  'Overgrow', // 64
  'Blaze', // 65
  'Torrent', // 66
  'Swarm', // 67
  'Rock Head', // 68
  'Drought', // 69
  'Arena Trap', // 70
  'Vital Spirit', // 71
  'White Smoke', // 72
  'Pure Power', // 73
  'Shell Armor', // 74
  'Air Lock', // 75
  'Tangled Feet', // 76
  'Motor Drive', // 77
  'Rivalry', // 78
  'Steadfast', // 79
  'Snow Cloak', // 80
  'Gluttony', // 81
  'Anger Point', // 82
  'Unburden', // 83
  'Heatproof', // 84
  'Simple', // 85
  'Dry Skin', // 86
  'Download', // 87
  'Iron Fist', // 88
  'Poison Heal', // 89
  'Adaptability', // 90
  'Skill Link', // 91
  'Hydration', // 92
  'Solar Power', // 93
  'Quick Feet', // 94
  'Normalize', // 95
  'Sniper', // 96
  'Magic Guard', // 97
  'No Guard', // 98
  'Stall', // 99
  'Technician', // 100
  'Leaf Guard', // 101
  'Klutz', // 102
  'Mold Breaker', // 103
  'Super Luck', // 104
  'Aftermath', // 105
  'Anticipation', // 106
  'Forewarn', // 107
  'Unaware', // 108
  'Tinted Lens', // 109
  'Filter', // 110
  'Slow Start', // 111
  'Scrappy', // 112
  'Storm Drain', // 113
  'Ice Body', // 114
  'Solid Rock', // 115
  'Snow Warning', // 116
  'Honey Gather', // 117
  'Frisk', // 118
  'Reckless', // 119
  'Multitype', // 120
  'Flower Gift', // 121
  'Bad Dreams', // 122
  'Pickpocket', // 123
  'Sheer Force', // 124
  'Contrary', // 125
  'Unnerve', // 126
  'Defiant', // 127
  'Defeatist', // 128
  'Cursed Body', // 129
  'Healer', // 130
  'Friend Guard', // 131
  'Weak Armor', // 132
  'Heavy Metal', // 133
  'Light Metal', // 134
  'Multiscale', // 135
  'Toxic Boost', // 136
  'Flare Boost', // 137
  'Harvest', // 138
  'Telepathy', // 139
  'Moody', // 140
  'Overcoat', // 141
  'Poison Touch', // 142
  'Regenerator', // 143
  'Big Pecks', // 144
  'Sand Rush', // 145
  'Wonder Skin', // 146
  'Analytic', // 147
  'Illusion', // 148
  'Imposter', // 149
  'Infiltrator', // 150
  'Mummy', // 151
  'Moxie', // 152
  'Justified', // 153
  'Rattled', // 154
  'Magic Bounce', // 155
  'Sap Sipper', // 156
  'Prankster', // 157
  'Sand Force', // 158
  'Iron Barbs', // 159
  'Zen Mode', // 160
  'Victory Star', // 161
  'Turboblaze', // 162
  'Teravolt', // 163
  'Aroma Veil', // 164
  'Flower Veil', // 165
  'Cheek Pouch', // 166
  'Protean', // 167
  'Fur Coat', // 168
  'Magician', // 169
  'Bulletproof', // 170
  'Competitive', // 171
  'Strong Jaw', // 172
  'Refrigerate', // 173
  'Sweet Veil', // 174
  'Stance Change', // 175
  'Gale Wings', // 176
  'Mega Launcher', // 177
  'Grass Pelt', // 178
  'Symbiosis', // 179
  'Tough Claws', // 180
  'Pixilate', // 181
  'Gooey', // 182
  'Aerilate', // 183
  'Parental Bond', // 184
  'Dark Aura', // 185
  'Fairy Aura', // 186
  'Aura Break', // 187
  'Primordial Sea', // 188
  'Desolate Land', // 189
  'Delta Stream', // 190
  'Stamina', // 191
  'Wimp Out', // 192
  'Emergency Exit', // 193
  'Water Compaction', // 194
  'Merciless', // 195
  'Shields Down', // 196
  'Stakeout', // 197
  'Water Bubble', // 198
  'Steelworker', // 199
  'Berserk', // 200
  'Slush Rush', // 201
  'Long Reach', // 202
  'Liquid Voice', // 203
  'Triage', // 204
  'Galvanize', // 205
  'Surge Surfer', // 206
  'Schooling', // 207
  'Disguise', // 208
  'Battle Bond', // 209
  'Power Construct', // 210
  'Corrosion', // 211
  'Comatose', // 212
  'Queenly Majesty', // 213
  'Innards Out', // 214
  'Dancer', // 215
  'Battery', // 216
  'Fluffy', // 217
  'Dazzling', // 218
  'Soul Heart', // 219
  'Tangling Hair', // 220
  'Receiver', // 221
  'Power Of Alchemy', // 222
  'Beast Boost', // 223
  'Rks System', // 224
  'Electric Surge', // 225
  'Psychic Surge', // 226
  'Misty Surge', // 227
  'Grassy Surge', // 228
  'Full Metal Body', // 229
  'Shadow Shield', // 230
  'Prism Armor', // 231
  'Neuroforce', // 232
  'Intrepid Sword', // 233
  'Dauntless Shield', // 234
  'Libero', // 235
  'Ball Fetch', // 236
  'Cotton Down', // 237
  'Propeller Tail', // 238
  'Mirror Armor', // 239
  'Gulp Missile', // 240
  'Stalwart', // 241
  'Steam Engine', // 242
  'Punk Rock', // 243
  'Sand Spit', // 244
  'Ice Scales', // 245
  'Ripen', // 246
  'Ice Face', // 247
  'Power Spot', // 248
  'Mimicry', // 249
  'Screen Cleaner', // 250
  'Steely Spirit', // 251
  'Perish Body', // 252
  'Wandering Spirit', // 253
  'Gorilla Tactics', // 254
  'Neutralizing Gas', // 255
  'Pastel Veil', // 256
  'Hunger Switch', // 257
  'Quick Draw', // 258
  'Unseen Fist', // 259
  'Curious Medicine', // 260
  'Transistor', // 261
  'Dragons Maw', // 262
  'Chilling Neigh', // 263
  'Grim Neigh', // 264
  'As One (Glastrier)', // 265
  'As One (Spectrier)', // 266
  'Lingering Aroma', // 267
  'Seed Sower', // 268
  'Thermal Exchange', // 269
  'Anger Shell', // 270
  'Purifying Salt', // 271
  'Well Baked Body', // 272
  'Wind Rider', // 273
  'Guard Dog', // 274
  'Rocky Payload', // 275
  'Wind Power', // 276
  'Zero To Hero', // 277
  'Commander', // 278
  'Electromorphosis', // 279
  'Protosynthesis', // 280
  'Quark Drive', // 281
  'Good As Gold', // 282
  'Vessel Of Ruin', // 283
  'Sword Of Ruin', // 284
  'Tablets Of Ruin', // 285
  'Beads Of Ruin', // 286
  'Orichalcum Pulse', // 287
  'Hadron Engine', // 288
  'Opportunist', // 289
  'Cud Chew', // 290
  'Sharpness', // 291
  'Supreme Overlord', // 292
  'Costar', // 293
  'Toxic Debris', // 294
  'Armor Tail', // 295
  'Earth Eater', // 296
  'Mycelium Might', // 297
  'Hospitality', // 298
  'Mind\'s Eye', // 299
  'Embody Aspect (Teal)', // 300
  'Embody Aspect (Hearthflame)', // 301
  'Embody Aspect (Wellspring)', // 302
  'Embody Aspect (Cornerstone)', // 303
  'Toxic Chain', // 304
  'Supersweet Syrup', // 305
];

export const NATURES: readonly string[] = [
  'Hardy', // 0
  'Lonely', // 1
  'Brave', // 2
  'Adamant', // 3
  'Naughty', // 4
  'Bold', // 5
  'Docile', // 6
  'Relaxed', // 7
  'Impish', // 8
  'Lax', // 9
  'Timid', // 10
  'Hasty', // 11
  'Serious', // 12
  'Jolly', // 13
  'Naive', // 14
  'Modest', // 15
  'Mild', // 16
  'Quiet', // 17
  'Bashful', // 18
  'Rash', // 19
  'Calm', // 20
  'Gentle', // 21
  'Sassy', // 22
  'Careful', // 23
  'Quirky', // 24
];
