function parseGBF(result) {
    var metaData = readGBKMeta(result);
	var sequence = readGBKSequence(result);
    var features = JSON.parse(readGBKFeatures(result));
	features.metadata = JSON.parse(metaData);
	features.sequence = JSON.parse(sequence).sequence;
	return features;
 }

    function readGBKMeta(gbkText) {
    var lines = gbkText.split(/\n/g),
        currentline,
        i = 0,
        j,
        definition = "",
        taxonomy = "",
        ref_obj = {},
        position,
        textline,
        authors = [],
        citation = [],
        title = [],
        pubmed = [],
        tax_array = [],
        medline = [],
        obj = {};
    while (i < lines.length) {
        currentline = lines[i].split(/\s+/g);
        //Locus has the format LOCUS locusname sequencelength bp molecule_type residue_type division modification_data
        if ("LOCUS" === lines[i].slice(0, 5)) {
            obj.locusname = currentline[1];
            obj.sequence_length = currentline[2];
            obj.molecule_type = currentline[4];
            obj.residue_type = currentline[5];
            obj.division = currentline[6];
            obj.modification_date = currentline[7];
        //Definition has the format DEFINITION name_of_record
        } else if ("DEFINITION" === lines[i].slice(0, 10)) {
            definition = lines[i].slice(10).trim();
            j = i + 1;
            while (" " === lines[j].slice(0, 1)) {
                definition += " " + lines[j].trim();
                i = j;
                j += 1;
            }
            obj.definition = definition;
        //Accession has the format ACCESSION accession
        } else if ("ACCESSION" === lines[i].slice(0, 9)) {
            obj.accession = currentline[1];
        //Version has the format VERSION version
        } else if ("VERSION" === lines[i].slice(0, 7)) {
            obj.version = currentline[1];
            obj.gi = currentline[2].slice(3);
        //Keywords has the format KEYWORDS keywords #This metadata is depreciated
        } else if ("KEYWORDS" === lines[i].slice(0, 8)) {
            obj.keywords = currentline[1];
        //SOURCE has the format SOURCE species/strain_name
        } else if ("SOURCE" === lines[i].slice(0, 6)) {
            obj.source = lines[i].slice(6).trim();
        //ORGANISM has the format ORGANISM formal_scientific_name
        } else if ("ORGANISM" === lines[i].slice(2, 10)) {
            obj.organism = lines[i].slice(10).trim();
            j = i + 1;
            //Following the ORGANISM line are the taxonomy lines.
            //Each position in the hierarchy are separated by semicolons
            while (" " === lines[j].slice(0, 1)) {
                taxonomy += " " + lines[j].trim();
                i = j;
                j += 1;
            }
            taxonomy = taxonomy.replace(/ |\./g, '');
            taxonomy_array = taxonomy.split(";");
            obj.taxonomy = taxonomy;
            obj.tax_array = taxonomy_array;
        //REFERENCES can include an arbitrary number of references
        //It follows as:
        //REFERENCE number
        //  AUTHOR authornames #Can be multilined
        //  TITLE title #Can be multilined
        //  JOURNAL citation #Can be multilined
        //   PUBMED id
        //   MEDLINE id 
        } else if ("REFERENCE" === lines[i].slice(0, 9)) {
            position = currentline[1].split(/\s+/g)[0];
        } else if ("AUTHORS" === lines[i].slice(2, 9)) {
            textline = lines[i].slice(9).trim();
            j = i + 1;
            while ("   " === lines[j].slice(0, 3)) {
                textline += " " + lines[j].trim();
                i = j;
                j += 1;
            }
            authors[position - 1] = textline;
        } else if ("TITLE" === lines[i].slice(2, 7)) {
            textline = lines[i].slice(7).trim();
            j = i + 1;
            while ("   " === lines[j].slice(0, 3)) {
                textline += " " + lines[j].trim();
                i = j;
                j += 1;
            }
            title[position - 1] = textline;
        } else if ("JOURNAL" === lines[i].slice(2, 9)) {
            textline = lines[i].slice(9).trim();
            j = i + 1;
            while ("    " === lines[j].slice(0, 4)) {
                textline += " " + lines[j].trim();
                i = j;
                j += 1;
            }
            citation[position - 1] = textline;
        } else if ("PUBMED" === lines[i].slice(3, 9)) {
            pubmed[position - 1] = lines[i].slice(9).trim();
        } else if ("MEDLINE" === lines[i].slice(3, 10)) {
            medline[position - 1] = lines[i].slice(10).trim();
        //COMMENT comment #can be multilined
        } else if ("COMMENT" === lines[i].slice(0, 7)) {
            textline = lines[i].slice(8).trim();
            while ("    " === lines[j].slice(0, 4)) {
                textline += " " + lines[j].trim();
                i = j;
                j += 1;
            }
            obj.comment = textline;
        }
        i += 1;
    }
    //Each of the reference features are picked up in an array that is put
    //in the object after every line is read.
    if (0 !== authors.length) ref_obj.authors = authors;
    if (0 !== title.length) ref_obj.titles = title;
    if (0 !== citation.length) ref_obj.citations = citation;
    if (0 !== pubmed.length) ref_obj.pubmedids = pubmed;
    if (0 !== medline.length) ref_obj.medline = medline;
    if (undefined !== typeof ref_obj) obj.references = ref_obj;
    return JSON.stringify(obj);
}

function process_location(location_string) {
    var index,
        matches = [],
        newlocation = '',
        segment = {},
        segs = [],
        i,
        segments = [];
    location_string = location_string.replace(/<|>/g, '');
    if (/[0-9]/g.test(location_string.slice(0, 1))) {
        matches = location_string.match(/(\d+)\.\.(\d+)/);
        segment.start = matches[1];
        segment.end = matches[2];
        segments[0] = segment;
        return segments;

    }
    while (location_string.match(/complement|join/g)) {
        if (/[0-9]/g.test(location_string.slice(0, 1))) {
            index = location_string.match(/j|c/);
            newlocation = location_string.slice(0, index - 1);
            location_string = location_string.slice(index);
        } else if (/complement/.test(location_string.slice(0, 10))) {
            location_string = location_string.replace(/(\d+)\.\.(\d+)/g, "$2..$1");
            location_string = location_string.slice(11, -1);
        } else if (/join/.test(location_string.slice(0, 4))) {
            location_string = location_string.slice(5, -1);
        }
    }
    newlocation += location_string;
    if (/,/g.test(newlocation)) {
        segs = newlocation.split(/,/);
    } else {
        segs[0] = newlocation;
    }
    for (i = 0; i < segs.length; i += 1) {
        segment = {};
        matches = segs[i].match(/(\d+)\.\.(\d+)/);
        segment.start = matches[1];
        segment.end = matches[2];
        segments.push(segment);
    }
    return segments;
}

function readGBKFeatures(gbkText) {
    var lines = gbkText.split(/\n/g),
        i = 0,
        j,
        k,
        textline,
        features = [],
        feature = {},
        obj = {},
        counter = -1,
        matches = [];
    while (i < lines.length) {
        //Start reading at the FEATURES line
        if ("FEATURES" === lines[i].slice(0, 8)) {
            j = i + 1;
            //Stop reading at the ORIGIN line
            while ("ORIGIN" !== lines[j].slice(0, 6)) {
                if (/^\s{5}\w/.test(lines[j])) {
                    counter += 1;
                    k = j + 1;
                    textline = lines[j].trim();
                    while (/^\s{6}/g.test(lines[k]) && /^[a-z0-9]/gi.test(lines[k].trim())) {
                        textline += lines[k].trim();
                        j = k;
                        k += 1;
                    }
                    textline = textline.trim().split(/\s+/g);
                    feature = {};
                    feature.feature = textline[0];
                    feature.location = process_location(textline[1]);
                    features[counter] = feature;
                } else if (/^\//.test(lines[j].trim())) {
                    textline = lines[j].trim().slice(1);
                    k = j + 1;
                    while (/^\s{6}/g.test(lines[k]) && /^[A-Z]/g.test(lines[k].trim())) {
                        textline += lines[k].trim();
                        j = k;
                        k += 1;
                    }
                    if (/[\w|\W]*=[\w|\W]*/.test(textline)) {
                        matches = textline.match(/([\w|\W]*)=([\w|\W]*)/);
                        feature[matches[1]] = matches[2].replace(/\"/g, '');
                        features[counter] = feature;
                    }
                }
                i = j;
                j += 1;
            }
        }
        i += 1;
    }
    obj.features = features;
    return JSON.stringify(obj);
}

function readGBKSequence(gbkText) {
    var lines = gbkText.split(/\n/g),
        i = 0,
        obj = {},
        sequence = '',
        seq;
    while (i < lines.length) {
        if ("ORIGIN" === lines[i].slice(0, 6)) {
            while ("//" !== lines[i].slice(0, 2)) {
               if (lines[i].trim().match(/^\d+/)) {
                    seq = lines[i].replace(/\s+|\d/g, '');
                    sequence += seq;
                }
                i += 1;
            }
        }
        i += 1;
    }
    obj.sequence = sequence;
    return JSON.stringify(obj);
}
/*
if(module != undefined && module.exports != undefined){
	module.exports = parseGBF;
}
*/