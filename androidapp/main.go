package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"image/color"
	"math/rand"
	"strings"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/canvas"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/layout"
	"fyne.io/fyne/v2/widget"
)

//go:embed data/hsk1.json data/hsk2.json data/hsk3.json data/hsk4.json data/hsk5.json
var dataFS embed.FS

type Card struct {
	ID          int    `json:"id"`
	Traditional string `json:"traditional"`
	Simplified  string `json:"simplified"`
	Pinyin      string `json:"pinyin"`
	Definitions string `json:"definitions"`
	Level       int    `json:"-"`
}

type LevelKey string

const (
	LevelAll LevelKey = "all"
)

var levelColors = map[LevelKey]color.Color{
	"1":      color.NRGBA{R: 0x38, G: 0xBD, B: 0xF8, A: 0xFF},
	"2":      color.NRGBA{R: 0x34, G: 0xD3, B: 0x99, A: 0xFF},
	"3":      color.NRGBA{R: 0xFB, G: 0xBF, B: 0x24, A: 0xFF},
	"4":      color.NRGBA{R: 0xFB, G: 0x71, B: 0x85, A: 0xFF},
	"5":      color.NRGBA{R: 0xA7, G: 0x8B, B: 0xFA, A: 0xFF},
	LevelAll: color.NRGBA{R: 0x94, G: 0xA3, B: 0xB8, A: 0xFF},
}

var allCards = map[LevelKey][]Card{}

func loadAll() error {
	for _, lvl := range []int{1, 2, 3, 4, 5} {
		b, err := dataFS.ReadFile(fmt.Sprintf("data/hsk%d.json", lvl))
		if err != nil {
			return err
		}
		var cs []Card
		if err := json.Unmarshal(b, &cs); err != nil {
			return err
		}
		for i := range cs {
			cs[i].Level = lvl
		}
		allCards[LevelKey(fmt.Sprintf("%d", lvl))] = cs
	}
	all := []Card{}
	for _, lvl := range []int{1, 2, 3, 4, 5} {
		all = append(all, allCards[LevelKey(fmt.Sprintf("%d", lvl))]...)
	}
	allCards[LevelAll] = all
	return nil
}

type Deck struct {
	level     LevelKey
	all       []Card
	visible   []Card
	order     []int
	idx       int
	flipped   bool
	shuffled  bool
	hideKnown bool
	known     map[string]bool
	prefs     fyne.Preferences
}

func NewDeck(prefs fyne.Preferences) *Deck {
	d := &Deck{
		level: "1",
		known: loadKnown(prefs),
		prefs: prefs,
	}
	d.setLevel("1")
	return d
}

func cardKey(c Card) string {
	return fmt.Sprintf("%d-%d", c.Level, c.ID)
}

func loadKnown(p fyne.Preferences) map[string]bool {
	raw := p.StringWithFallback("known", "[]")
	var arr []string
	_ = json.Unmarshal([]byte(raw), &arr)
	m := map[string]bool{}
	for _, k := range arr {
		m[k] = true
	}
	return m
}

func (d *Deck) saveKnown() {
	arr := make([]string, 0, len(d.known))
	for k := range d.known {
		arr = append(arr, k)
	}
	b, _ := json.Marshal(arr)
	d.prefs.SetString("known", string(b))
}

func (d *Deck) setLevel(l LevelKey) {
	d.level = l
	d.all = allCards[l]
	d.rebuild()
}

func (d *Deck) rebuild() {
	d.visible = d.visible[:0]
	if d.hideKnown {
		for _, c := range d.all {
			if !d.known[cardKey(c)] {
				d.visible = append(d.visible, c)
			}
		}
	} else {
		d.visible = append([]Card{}, d.all...)
	}
	d.order = make([]int, len(d.visible))
	for i := range d.order {
		d.order[i] = i
	}
	if d.shuffled {
		rand.Shuffle(len(d.order), func(i, j int) { d.order[i], d.order[j] = d.order[j], d.order[i] })
	}
	d.idx = 0
	d.flipped = false
}

func (d *Deck) Card() *Card {
	if len(d.visible) == 0 {
		return nil
	}
	return &d.visible[d.order[d.idx]]
}

func (d *Deck) Total() int    { return len(d.visible) }
func (d *Deck) Position() int { return d.idx + 1 }

func (d *Deck) Next() {
	if d.Total() == 0 {
		return
	}
	d.idx = (d.idx + 1) % d.Total()
	d.flipped = false
}

func (d *Deck) Prev() {
	if d.Total() == 0 {
		return
	}
	d.idx = (d.idx - 1 + d.Total()) % d.Total()
	d.flipped = false
}

func (d *Deck) Flip() { d.flipped = !d.flipped }

func (d *Deck) IsKnown() bool {
	c := d.Card()
	if c == nil {
		return false
	}
	return d.known[cardKey(*c)]
}

func (d *Deck) ToggleKnown() {
	c := d.Card()
	if c == nil {
		return
	}
	k := cardKey(*c)
	if d.known[k] {
		delete(d.known, k)
	} else {
		d.known[k] = true
	}
	d.saveKnown()
}

func (d *Deck) ResetKnown() {
	d.known = map[string]bool{}
	d.saveKnown()
	d.rebuild()
}

func (d *Deck) KnownCount() int { return len(d.known) }

func main() {
	if err := loadAll(); err != nil {
		panic(err)
	}

	a := app.NewWithID("com.hsk.flashcards")
	w := a.NewWindow("HSK Flashcards 2025")

	deck := NewDeck(a.Preferences())

	hanzi := canvas.NewText("", color.White)
	hanzi.TextSize = 80
	hanzi.Alignment = fyne.TextAlignCenter
	hanzi.TextStyle = fyne.TextStyle{Bold: false}

	pinyin := canvas.NewText("", levelColors["1"])
	pinyin.TextSize = 26
	pinyin.Alignment = fyne.TextAlignCenter

	defs := widget.NewLabel("")
	defs.Alignment = fyne.TextAlignCenter
	defs.Wrapping = fyne.TextWrapWord

	traditional := canvas.NewText("", color.NRGBA{R: 0x66, G: 0x66, B: 0x88, A: 0xFF})
	traditional.TextSize = 16
	traditional.Alignment = fyne.TextAlignCenter

	hint := canvas.NewText("tap to reveal", color.NRGBA{R: 0x44, G: 0x44, B: 0x66, A: 0xFF})
	hint.TextSize = 12
	hint.Alignment = fyne.TextAlignCenter

	badge := canvas.NewText("HSK 1", color.Black)
	badge.TextSize = 12
	badge.TextStyle = fyne.TextStyle{Bold: true}

	knownMark := canvas.NewText("", color.NRGBA{R: 0x34, G: 0xD3, B: 0x99, A: 0xFF})
	knownMark.TextSize = 16
	knownMark.TextStyle = fyne.TextStyle{Bold: true}

	cardBorder := canvas.NewRectangle(color.Transparent)
	cardBorder.StrokeColor = levelColors["1"]
	cardBorder.StrokeWidth = 2
	cardBorder.CornerRadius = 20

	cardBg := canvas.NewRectangle(color.NRGBA{R: 0x16, G: 0x21, B: 0x3E, A: 0xFF})
	cardBg.CornerRadius = 20

	progress := widget.NewProgressBar()
	progress.Min = 0
	progress.Max = 1

	counter := widget.NewLabel("0 / 0")
	knownLabel := widget.NewLabel("✓ 0")

	var refresh func()

	cardContent := container.NewVBox()
	cardStack := container.NewStack(cardBg, cardBorder, container.NewPadded(cardContent))

	cardTap := widget.NewButton("", func() {
		deck.Flip()
		refresh()
	})
	cardTap.Importance = widget.LowImportance

	// overlay tappable region by stacking card visuals + invisible button
	cardArea := container.NewStack(cardStack, cardTap)

	prevBtn := widget.NewButton("← Prev", func() { deck.Prev(); refresh() })
	nextBtn := widget.NewButton("Next →", func() { deck.Next(); refresh() })

	shuffleBtn := widget.NewButton("⇌", func() {
		deck.shuffled = !deck.shuffled
		deck.rebuild()
		refresh()
	})

	knownBtn := widget.NewButton("○", func() { deck.ToggleKnown(); refresh() })

	hideKnownCheck := widget.NewCheck("Hide known cards", func(v bool) {
		deck.hideKnown = v
		deck.rebuild()
		refresh()
	})

	resetBtn := widget.NewButton("Reset progress", func() {
		deck.ResetKnown()
		refresh()
	})
	resetBtn.Importance = widget.DangerImportance

	levels := []struct {
		key   LevelKey
		label string
	}{
		{"1", "HSK 1"},
		{"2", "HSK 2"},
		{"3", "HSK 3"},
		{"4", "HSK 4"},
		{"5", "HSK 5"},
		{LevelAll, "All"},
	}

	tabItems := make([]*container.TabItem, 0, len(levels))
	for _, l := range levels {
		count := len(allCards[l.key])
		tabItems = append(tabItems, container.NewTabItem(
			fmt.Sprintf("%s (%d)", l.label, count),
			widget.NewLabel(""),
		))
	}
	tabs := container.NewAppTabs(tabItems...)
	tabs.OnSelected = func(t *container.TabItem) {
		for i, l := range levels {
			if tabs.Items[i] == t {
				deck.setLevel(l.key)
				refresh()
				return
			}
		}
	}

	refresh = func() {
		c := deck.Card()
		col := levelColors[deck.level]
		cardBorder.StrokeColor = col
		cardBorder.Refresh()
		pinyin.Color = col
		badge.Text = fmt.Sprintf("HSK %s", deck.level)
		if deck.level == LevelAll {
			badge.Text = "HSK All"
		}
		badge.Refresh()

		cardContent.Objects = nil

		if c == nil {
			empty := canvas.NewText("All cards known! 🎉", color.NRGBA{R: 0x55, G: 0x55, B: 0x77, A: 0xFF})
			empty.TextSize = 18
			empty.Alignment = fyne.TextAlignCenter
			cardContent.Add(layout.NewSpacer())
			cardContent.Add(empty)
			cardContent.Add(layout.NewSpacer())
			counter.SetText("0 / 0")
			progress.SetValue(0)
			knownLabel.SetText(fmt.Sprintf("✓ %d", deck.KnownCount()))
			knownBtn.SetText("○")
			cardContent.Refresh()
			return
		}

		badgeRow := container.NewBorder(nil, nil, badge, nil)
		if deck.IsKnown() {
			km := canvas.NewText("✓", color.NRGBA{R: 0x34, G: 0xD3, B: 0x99, A: 0xFF})
			km.TextSize = 16
			km.TextStyle = fyne.TextStyle{Bold: true}
			badgeRow = container.NewBorder(nil, nil, badge, km)
		}
		cardContent.Add(badgeRow)
		cardContent.Add(layout.NewSpacer())

		if !deck.flipped {
			hanzi.Text = c.Simplified
			hanzi.TextSize = 80
			hanzi.Color = color.White
			hanzi.Refresh()
			cardContent.Add(hanzi)
			if c.Pinyin != "" {
				p := canvas.NewText(c.Pinyin, col)
				p.TextSize = 18
				p.Alignment = fyne.TextAlignCenter
				cardContent.Add(p)
			}
			cardContent.Add(layout.NewSpacer())
			cardContent.Add(hint)
		} else {
			h := canvas.NewText(c.Simplified, color.White)
			h.TextSize = 40
			h.Alignment = fyne.TextAlignCenter
			cardContent.Add(h)

			p := canvas.NewText(c.Pinyin, col)
			p.TextSize = 26
			p.Alignment = fyne.TextAlignCenter
			cardContent.Add(p)

			if c.Traditional != "" && c.Traditional != c.Simplified {
				t := canvas.NewText(c.Traditional, color.NRGBA{R: 0x66, G: 0x66, B: 0x88, A: 0xFF})
				t.TextSize = 16
				t.Alignment = fyne.TextAlignCenter
				cardContent.Add(t)
			}

			parts := strings.Split(c.Definitions, ", ")
			if len(parts) > 5 {
				parts = parts[:5]
			}
			for i, dp := range parts {
				if dp == "" {
					continue
				}
				size := float32(13)
				clr := color.NRGBA{R: 0xA0, G: 0xA0, B: 0xC0, A: 0xFF}
				if i == 0 {
					size = 16
					clr = color.NRGBA{R: 0xD0, G: 0xD0, B: 0xF0, A: 0xFF}
				}
				dt := canvas.NewText(dp, clr)
				dt.TextSize = size
				dt.Alignment = fyne.TextAlignCenter
				cardContent.Add(dt)
			}
			cardContent.Add(layout.NewSpacer())
		}
		cardContent.Refresh()

		counter.SetText(fmt.Sprintf("%d / %d", deck.Position(), deck.Total()))
		if deck.Total() > 0 {
			progress.SetValue(float64(deck.Position()) / float64(deck.Total()))
		} else {
			progress.SetValue(0)
		}
		knownLabel.SetText(fmt.Sprintf("✓ %d", deck.KnownCount()))
		if deck.IsKnown() {
			knownBtn.SetText("✓")
		} else {
			knownBtn.SetText("○")
		}
		if deck.shuffled {
			shuffleBtn.SetText("⇌•")
		} else {
			shuffleBtn.SetText("⇌")
		}
	}

	progressRow := container.NewBorder(nil, nil, counter, knownLabel, progress)

	controls := container.NewGridWithColumns(3,
		prevBtn,
		container.NewGridWithColumns(2, shuffleBtn, knownBtn),
		nextBtn,
	)

	options := container.NewBorder(nil, nil, hideKnownCheck, resetBtn)

	content := container.NewBorder(
		container.NewVBox(tabs, progressRow),
		container.NewVBox(controls, options),
		nil, nil,
		container.NewPadded(cardArea),
	)

	w.SetContent(content)
	w.Resize(fyne.NewSize(400, 700))

	refresh()
	w.ShowAndRun()
}
