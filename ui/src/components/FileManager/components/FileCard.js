import React, { Component } from 'react';
import "../styles/FileCard.css";
import "../styles/TorrentCard.css";
import {downloadFileUrl} from "../services/FileService";
import cogoToast from 'cogo-toast';
import {uri} from "../../../uri";

class FileCard extends Component {
    constructor(props) {
        super(props);
        this.state = {data: null, threeDotMenuVisible: "", MenuTranslateY: "0px"};
        this.humanFileSize = this.humanFileSize.bind(this);
        this.trimString = this.trimString.bind(this);
        this.getFileIcon = this.getFileIcon.bind(this);
        this.handleDotMenu = this.handleDotMenu.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleDownload = this.handleDownload.bind(this);
    }

    componentDidMount() {
        this.props.tFetcher(false);

        // reason to write below line twice: https://stackoverflow.com/questions/55966533/show-alert-on-browser-back-button-event-on-react-js
        window.history.pushState({name: "browserBack"}, "on browser back click", window.location.href);
        window.history.pushState({name: "browserBack"}, "on browser back click", window.location.href);
        
        // switch to previous directory when user presses back button in browser
        window.addEventListener('popstate', () => {this.props.goBack()}, false)
    }

    componentWillUnmount() {
        this.props.tFetcher(true);
    }

    goBack(){
        this.setState({data: null})
    }

    humanFileSize(size) {
        if (!size){return "0 Bytes"}

        var i = Math.floor( Math.log(size) / Math.log(1024) );
        return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    };

    trimString(string, length){
        let w = window.innerWidth;
        
        if ( w >= 800){
            return string;
        }else {
            let postfix = "";
            if (string.length > length){
                postfix = "...";
            }
            return string.slice(0, length).trim()+postfix;
        }
    }

    getFileIcon(ext){
        if ([".mkv", ".mp4", ".avi"].includes(ext)){
            return "/autolycus/icons/video-file-icon.svg";
        }else if ([".txt", ".srt", ".md", ".docx"].includes(ext)){
            return "/autolycus/icons/doc-file-icon.svg";
        }else if ([".mp3", ".wav"].includes(ext)){
            return "/autolycus/icons/music-file-icon.svg";
        }else{
            return "/autolycus/icons/unknown-file-icon.svg";
        }
    }

    handleDotMenu(e, name){
        let windowH = window.innerHeight-30;
        let menuH = 220;

        if (!this.state.threeDotMenuVisible){
            this.setState({threeDotMenuVisible: name});
            document.addEventListener('click', this.handleOutsideClick, false);
            
            try{
                menuH = e.clientY+menuH;
                if (menuH > windowH){
                    let adjust = 50;
                    if (window.innerWidth < 800){
                        // adjust overflow menu
                        adjust = 100;
                    }
                    this.setState({MenuTranslateY: windowH-adjust-menuH+"px"});
                }
            } catch(err){}

        }else {
            this.setState({threeDotMenuVisible: "", MenuTranslateY: "0px"});
            document.removeEventListener('click', this.handleOutsideClick, false);
        }
    }

    handleOutsideClick(e) {
        if (!["torrent-card-menu-dot", "torrent-card-menu-dot-wrapper"].includes(e.target.className)){
            this.handleDotMenu();
        }
    }

    handleDownload(item, copyLink=false){
        if (item.type === "directory"){
            cogoToast.warn("directories not allowed", {position: "top-center", hideAfter: 1});
            return;
        }

        downloadFileUrl(item.path).then(response => {
            response.json().then(json => {
                if (response.status === 200){
                    let url = uri()+"/public/"+json.public_url_hash
                    if (copyLink){
                        // copy link to clipboard
                        const el = document.createElement('textarea');
                        el.value = url;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand('copy');
                        document.body.removeChild(el);
                        cogoToast.success("copied to clipboard", {position: "top-center", hideAfter: 1});
            
                    }else{
                        // download file
                        url = url+"?download=true"
                        let a = document.createElement('a');
                        a.href = url;
                        a.download = item.name;
                        a.click(); a.remove();
                        cogoToast.success("download started", {position: "top-center", hideAfter: 1});
                    }
                }
            })
        })

    }

    render(){
        return(
            <div>
                <div className="file-card" style={{cursor: "pointer"}} onClick={() => this.props.goBack()}>
                    <div className="file-card-info">
                        <img style={{width: "20px"}} src="/autolycus/icons/up-arrow.svg"/>
                        <p className="file-card-wrapper file-card-info-size">Folder Up</p>
                    </div>
                </div>

                {this.props.data.children &&
                this.props.data.children.map((item) => {
                    return (
                        <div className="file-card">
                            <div className="file-card-info">
                                {item.type === "directory" && <img src="/autolycus/icons/mac-folder-icon.svg"/>}
                                {item.type === "file" && <img style={{width:"32px"}} src={this.getFileIcon(item.ext)}/>}

                                <div className="file-card-wrapper">
                                    <p className="file-card-info-name" onClick={() => this.props.updateCard(item, this.props.data)}>{this.trimString(item.name, 30)}</p>
                                    {item.type === "file" && <p className="file-card-info-size">{this.humanFileSize(item.size)}</p>}
                                </div>
                            </div>


                            <div className="torrent-card-menu">
                                <div className="torrent-card-menu-dot-wrapper" onClick={(e) => this.handleDotMenu(e, item.name)}>
                                    <div className="torrent-card-menu-dot" />
                                    <div className="torrent-card-menu-dot" />
                                    <div className="torrent-card-menu-dot" />
                                </div>
                                {this.state.threeDotMenuVisible === item.name && (
                                    <div style={{transform: "translate(0px, "+this.state.MenuTranslateY+")"}} className="torrent-card-menu-contents">
                                        <div onClick={() => this.handleDownload(item)} className="torrent-card-menu-contents-items">
                                            <img src="/autolycus/icons/bxs-cloud-download.svg"/>
                                            <p>Download</p>
                                        </div>
                                        
                                        <div onClick={() => this.handleDownload(item, true)} className="torrent-card-menu-contents-items">
                                            <img src="/autolycus/icons/bx-link-alt.svg"/>
                                            <p>Copy Link</p>
                                        </div>

                                        <div className="torrent-card-menu-contents-items">
                                            <img src="/autolycus/icons/bx-edit-alt.svg"/>
                                            <p>Rename</p>
                                        </div>

                                        <div className="torrent-card-menu-contents-items">
                                            <img src="/autolycus/icons/bx-copy-alt.svg"/>
                                            <p>Copy</p>
                                        </div>

                                        <div className="torrent-card-menu-contents-items">
                                            <img src="/autolycus/icons/bx-cut.svg"/>
                                            <p>Cut</p>
                                        </div>

                                        <div className="torrent-card-menu-contents-items">
                                            <img src="/autolycus/icons/bx-paste.svg"/>
                                            <p>Paste</p>
                                        </div>

                                        <div className="torrent-card-menu-contents-items">
                                            <img src="/autolycus/icons/bx-trash.svg"/>
                                            <p onClick={this.handleDelete}>Delete</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    )
                })}
            </div>
        )
    }
}

export default FileCard;