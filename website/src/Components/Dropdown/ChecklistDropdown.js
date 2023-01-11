import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';

import * as React from 'react';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const languages = [
    {"id": 1, "name": "Afrikaans", "code": "afr"},
    {"id": 2, "name": "Amharic", "code": "amh"},
    {"id": 3, "name": "Arabic", "code": "ara"},
    {"id": 4, "name": "Assamese", "code": "asm"},
    {"id": 5, "name": "Azerbaijani", "code": "aze"},
    {"id": 6, "name": "Azerbaijani - Cyrilic", "code": "aze_cyrl"},
    {"id": 7, "name": "Belarusian", "code": "bel"},
    {"id": 8, "name": "Bengali", "code": "ben"},
    {"id": 9, "name": "Tibetan", "code": "bod"},
    {"id": 10, "name": "Bosnian", "code": "bos"},
    {"id": 11, "name": "Breton", "code": "bre"},
    {"id": 12, "name": "Bulgarian", "code": "bul"},
    {"id": 13, "name": "Catalan; Valencian", "code": "cat"},
    {"id": 14, "name": "Cebuano", "code": "ceb"},
    {"id": 15, "name": "Czech", "code": "ces"},
    {"id": 16, "name": "Chinese - Simplified", "code": "chi_sim"},
    {"id": 17, "name": "Chinese - Traditional", "code": "chi_tra"},
    {"id": 18, "name": "Cherokee", "code": "chr"},
    {"id": 19, "name": "Corsican", "code": "cos"},
    {"id": 20, "name": "Welsh", "code": "cym"},
    {"id": 21, "name": "Danish", "code": "dan"},
    {"id": 22, "name": "German", "code": "deu"},
    {"id": 23, "name": "Dzongkha", "code": "dzo"},
    {"id": 24, "name": "Greek, Modern (1453-)", "code": "ell"},
    {"id": 25, "name": "English", "code": "eng"},
    {"id": 26, "name": "English, Middle (1100-1500)", "code": "enm"},
    {"id": 27, "name": "Esperanto", "code": "epo"},
    {"id": 28, "name": "Math / equation detection module", "code": "equ"},
    {"id": 29, "name": "Estonian", "code": "est"},
    {"id": 30, "name": "Basque", "code": "eus"},
    {"id": 31, "name": "Faroese", "code": "fao"},
    {"id": 32, "name": "Persian", "code": "fas"},
    {"id": 33, "name": "Filipino (old - Tagalog)", "code": "fil"},
    {"id": 34, "name": "Finnish", "code": "fin"},
    {"id": 35, "name": "French", "code": "fra"},
    {"id": 36, "name": "German - Fraktur", "code": "frk"},
    {"id": 37, "name": "French, Middle (ca.1400-1600)", "code": "frm"},
    {"id": 38, "name": "Western Frisian", "code": "fry"},
    {"id": 39, "name": "Scottish Gaelic", "code": "gla"},
    {"id": 40, "name": "Irish", "code": "gle"},
    {"id": 41, "name": "Galician", "code": "glg"},
    {"id": 42, "name": "Greek, Ancient (to 1453) (contrib)", "code": "grc"},
    {"id": 43, "name": "Gujarati", "code": "guj"},
    {"id": 44, "name": "Haitian; Haitian Creole", "code": "hat"},
    {"id": 45, "name": "Hebrew", "code": "heb"},
    {"id": 46, "name": "Hindi", "code": "hin"},
    {"id": 47, "name": "Croatian", "code": "hrv"},
    {"id": 48, "name": "Hungarian", "code": "hun"},
    {"id": 49, "name": "Armenian", "code": "hye"},
    {"id": 50, "name": "Inuktitut", "code": "iku"},
    {"id": 51, "name": "Indonesian", "code": "ind"},
    {"id": 52, "name": "Icelandic", "code": "isl"},
    {"id": 53, "name": "Italian", "code": "ita"},
    {"id": 54, "name": "Italian - Old", "code": "ita_old"},
    {"id": 55, "name": "Javanese", "code": "jav"},
    {"id": 56, "name": "Japanese", "code": "jpn"},
    {"id": 57, "name": "Kannada", "code": "kan"},
    {"id": 58, "name": "Georgian", "code": "kat"},
    {"id": 59, "name": "Georgian - Old", "code": "kat_old"},
    {"id": 60, "name": "Kazakh", "code": "kaz"},
    {"id": 61, "name": "Central Khmer", "code": "khm"},
    {"id": 62, "name": "Kirghiz; Kyrgyz", "code": "kir"},
    {"id": 63, "name": "Kurmanji (Kurdish - Latin Script)", "code": "kmr"},
    {"id": 64, "name": "Korean", "code": "kor"},
    {"id": 65, "name": "Korean (vertical)", "code": "kor_vert"},
    {"id": 66, "name": "Lao", "code": "lao"},
    {"id": 67, "name": "Latin", "code": "lat"},
    {"id": 68, "name": "Latvian", "code": "lav"},
    {"id": 69, "name": "Lithuanian", "code": "lit"},
    {"id": 70, "name": "Luxembourgish", "code": "ltz"},
    {"id": 71, "name": "Malayalam", "code": "mal"},
    {"id": 72, "name": "Marathi", "code": "mar"},
    {"id": 73, "name": "Macedonian", "code": "mkd"},
    {"id": 74, "name": "Maltese", "code": "mlt"},
    {"id": 75, "name": "Mongolian", "code": "mon"},
    {"id": 76, "name": "Maori", "code": "mri"},
    {"id": 77, "name": "Malay", "code": "msa"},
    {"id": 78, "name": "Burmese", "code": "mya"},
    {"id": 79, "name": "Nepali", "code": "nep"},
    {"id": 80, "name": "Dutch; Flemish", "code": "nld"},
    {"id": 81, "name": "Norwegian", "code": "nor"},
    {"id": 82, "name": "Occitan (post 1500)", "code": "oci"},
    {"id": 83, "name": "Oriya", "code": "ori"},
    {"id": 84, "name": "Orientation and script detection module", "code": "osd"},
    {"id": 85, "name": "Panjabi; Punjabi", "code": "pan"},
    {"id": 86, "name": "Polish", "code": "pol"},
    {"id": 87, "name": "Portuguese", "code": "por"},
    {"id": 88, "name": "Pushto; Pashto", "code": "pus"},
    {"id": 89, "name": "Quechua", "code": "que"},
    {"id": 90, "name": "Romanian; Moldavian; Moldovan", "code": "ron"},
    {"id": 91, "name": "Russian", "code": "rus"},
    {"id": 92, "name": "Sanskrit", "code": "san"},
    {"id": 93, "name": "Sinhala; Sinhalese", "code": "sin"},
    {"id": 94, "name": "Slovak", "code": "slk"},
    {"id": 95, "name": "Slovenian", "code": "slv"},
    {"id": 96, "name": "Sindhi", "code": "snd"},
    {"id": 97, "name": "Spanish; Castilian", "code": "spa"},
    {"id": 98, "name": "Spanish; Castilian - Old", "code": "spa_old"},
    {"id": 99, "name": "Albanian", "code": "sqi"},
    {"id": 100, "name": "Serbian", "code": "srp"},
    {"id": 101, "name": "Serbian - Latin", "code": "srp_latn"},
    {"id": 102, "name": "Sundanese", "code": "sun"},
    {"id": 103, "name": "Swahili", "code": "swa"},
    {"id": 104, "name": "Swedish", "code": "swe"},
    {"id": 105, "name": "Syriac", "code": "syr"},
    {"id": 106, "name": "Tamil", "code": "tam"},
    {"id": 107, "name": "Tatar", "code": "tat"},
    {"id": 108, "name": "Telugu", "code": "tel"},
    {"id": 109, "name": "Tajik", "code": "tgk"},
    {"id": 110, "name": "Thai", "code": "tha"},
    {"id": 111, "name": "Tigrinya", "code": "tir"},
    {"id": 112, "name": "Tonga", "code": "ton"},
    {"id": 113, "name": "Turkish", "code": "tur"},
    {"id": 114, "name": "Uighur; Uyghur", "code": "uig"},
    {"id": 115, "name": "Ukrainian", "code": "ukr"},
    {"id": 116, "name": "Urdu", "code": "urd"},
    {"id": 117, "name": "Uzbek", "code": "uzb"},
    {"id": 118, "name": "Uzbek - Cyrilic", "code": "uzb_cyrl"},
    {"id": 119, "name": "Vietnamese", "code": "vie"},
    {"id": 120, "name": "Yiddish", "code": "yid"},
    {"id": 121, "name": "Yoruba", "code": "yor"}
]

export default class ChecklistDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            choice: [{"id": 87, "name": "Portuguese", "code": "por"}]
        }

        this.getChoice = this.getChoice.bind(this);
    }

    setVisible() {
        this.setState({ visible: true });
    }
    
    setInvisible() {
        this.setState({ visible: false });
    }

    getChoice() {
        return this.state.choice.map((x) => x.code).join('+');
    }

    handleChange(event) {

        const { target : { value } } = event;

        let duplicateRemoved = [];
        value.forEach((item) => {
            if (duplicateRemoved.findIndex((o) => o.id === item.id) >= 0) {
                duplicateRemoved = duplicateRemoved.filter((x) => x.id !== item.id);
            } else {
                duplicateRemoved.push(item);
            }
        });

        if (duplicateRemoved.length === 0) {
            duplicateRemoved = [
                {"id": 87, "name": "Portuguese", "code": "por"}
            ]
        }

        this.setState({ choice: duplicateRemoved });
    }

    render() {
        return (
            <div>
            {
                this.state.visible && <FormControl open={this.state.visible} sx={{mt: '0.5rem', width: '100%'}}>
                    <InputLabel>Language</InputLabel>
                    <Select
                        multiple
                        value={this.state.choice}
                        onChange={(e) => this.handleChange(e)}
                        input={<OutlinedInput label="Language" />}
                        renderValue={(selected) => selected.map((x) => x.code).join(', ')}
                        MenuProps={MenuProps}
                        sx={{height: '2.5rem'}}
                    >
                        {
                            languages.map((variant) => (
                                <MenuItem key={variant.id} value={variant} sx={{height: '2.5rem'}}>
                                    <Checkbox checked={this.state.choice.findIndex((item) => item.id === variant.id) >= 0} />
                                    <ListItemText primary={variant.name} />
                                </MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>
            }
            </div>
        );
    }
}