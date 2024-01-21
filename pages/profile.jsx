import {
  Avatar,
  Paper,
  Group,
  Text,
  Card,
  Space,
  Center,
  Divider,
  Image,
  Tabs,
  TypographyStylesProvider,
  Container,
  createStyles,
  ActionIcon,
  Collapse,
  Button,
  Modal,
  Loader,
  TextInput,
  Badge,
  rem,
} from "@mantine/core";
import { GiWaveCrest } from "react-icons/gi";
import { useState, useContext, useEffect } from "react";
import { DeSoIdentityContext } from "react-deso-protocol";
import {
  getSingleProfile,
  getFollowersForUser,
  getPostsForUser,
  getNFTsForUser,
  updateProfile,
  identity,
} from "deso-protocol";
import { Stream } from "../components/Stream/Stream";
import { useDisclosure } from "@mantine/hooks";
import classes from './wave/wave.module.css';
import Post from "@/components/Post";
import { Chat } from '@/components/Chat';
import { UpdateProfile } from "../components/UpdateProfile";
import { replaceURLs } from "../helpers/linkHelper";

export default function ProfilePage () {

  const { currentUser } = useContext(DeSoIdentityContext);
  const [posts, setPosts] = useState([]);
  const [NFTs, setNFTs] = useState([]);
  const [followerInfo, setFollowers] = useState({ followers: 0, following: 0 });
  const userPublicKey = currentUser?.PublicKeyBase58Check;
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [openedChat, { toggle }] = useDisclosure(true);



  const getFollowers = async () => {
    try {
      const following = await getFollowersForUser({
        PublicKeyBase58Check: userPublicKey,
      });
      const followers = await getFollowersForUser({
        PublicKeyBase58Check: userPublicKey,
        GetEntriesFollowingUsername: true,
      });

      setFollowers({ following, followers });

    } catch (error) {
      console.error("Error fetching follower data:", error);
    }
  }

  const getPosts = async () => {
    try {
      setIsLoadingPosts(true);
      const postData = await getPostsForUser({
        PublicKeyBase58Check: userPublicKey,
        NumToFetch: 25,
      });

      setPosts(postData.Posts);
      setIsLoadingPosts(false)
    } catch (error) {
      console.error("Error fetching user profile posts:", error);
      setIsLoadingPosts(false)
    }
    
  }

  const getNFTs = async () => {
    try {
      setIsLoadingNFTs(true);
      const nftData = await getNFTsForUser({
        UserPublicKeyBase58Check: userPublicKey,
      });

      setNFTs(nftData.NFTsMap);
      setIsLoadingNFTs(false);
    } catch (error) {
      console.error("Error fetching user nfts:", error);
      setIsLoadingNFTs(false);
    }
    
  }

  useEffect(() => {
    if (currentUser) {
      getFollowers();
      getPosts();
      getNFTs();
    }
  }, [currentUser]);


  return (
    <>
     
      <Divider
        my="xs"
        label={
          <>
            <Text fw={444} fz="xl">
            Profile
            </Text>
          </>
        }
        labelPosition="center"
      />

<Space h="lg"/>

      {currentUser ? (
        <>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
              <Image
                src={currentUser.ProfileEntryResponse?.ExtraData?.FeaturedImageURL || null}
                height={200}
                fallbackSrc="https://images.deso.org/4903a46ab3761c5d8bd57416ff411ff98b24b35fcf5480dde039eb9bae6eebe0.webp"
              />
            </Card.Section>
            <Center>
              <Avatar
                mx="auto"
                mt={-30}
                className={classes.avatar}
                size={80}
                radius={80}
                src={
                  `https://node.deso.org/api/v0/get-single-profile-picture/${userPublicKey}` ||
                  null
                }
                alt="Profile Picture"
              />
            </Center>
            <Space h="sm" />
            <Center>
              <Text fz="lg" fw={777} variant="gradient" truncate>
                {currentUser.ProfileEntryResponse?.Username ?? currentUser.PublicKeyBase58Check}
              </Text>
            </Center>
            <Group justify="left">
         
            <UpdateProfile />
            </Group>
            <Space h="sm" />
            

            {currentUser.ProfileEntryResponse === null ? (
              <>
                <Divider my="sm" />
                <Space h="sm" />
                <Center>
                  <Badge
                    size="md"
                    radius="sm"
                    variant="gradient"
                    gradient={{ from: "indigo", to: "cyan", deg: 45 }}
                  >
                    Go To Settings and Create A Username to Stream
                  </Badge>
                </Center>
                <Space h="sm" />
                <Divider my="sm" />
              </>
            ) : (
              <>
                <Stream />
              </>
            )}
            <Space h="sm" />

            <Paper shadow="xl" radius="md" p="xl">
              <Text
                fz="sm"
                style={{
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "wrap",
                }}
                dangerouslySetInnerHTML={{
                  __html:
                  currentUser.ProfileEntryResponse?.Description
                      ? replaceURLs(
                        currentUser.ProfileEntryResponse?.Description.replace(/\n/g, "<br>")
                        )
                      : "",
                }}
              />
            </Paper>
            <Space h="sm" />

            <Center>
              {followerInfo.followers && followerInfo.followers.NumFollowers ? (
                <Text fz="sm">
                  Followers: {followerInfo.followers.NumFollowers}
                </Text>
              ) : (
                <Text fz="sm">Followers: 0</Text>
              )}

              <Space w="sm" />
              <Divider size="sm" orientation="vertical" />
              <Space w="sm" />
              {followerInfo.following && followerInfo.following.NumFollowers ? (
                <Text fz="sm">
                  Following: {followerInfo.following.NumFollowers}
                </Text>
              ) : (
                <Text fz="sm">Following: 0</Text>
              )}
            </Center>
          </Card>
          
          <Space h="sm"/>
            <Center>
              <Button variant="light" hiddenFrom="md" onClick={toggle}>
               {openedChat ? (
                <>
                Close Chat
                </>
               ):(
                <>
                Open Chat
                </>
               )}

              </Button>
            </Center>
              <Group justify="center" hiddenFrom="md">

                <Collapse transitionDuration={1000} transitionTimingFunction="smooth" in={openedChat}>
                  <Chat handle={currentUser?.ProfileEntryResponse?.Username || "Anon"} />
                </Collapse>

              </Group>

          <Space h="xl" />

          <Space h="sm"/>
          <Tabs radius="sm" defaultValue="first">
            <Tabs.List grow position="center">
              <Tabs.Tab value="first">
                <Text fz="sm">Posts</Text>
              </Tabs.Tab>

              <Tabs.Tab value="second">
                <Text fz="sm">NFTs</Text>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="first">
            {isLoadingPosts ? (
  <>
    <Space h="md"/>
    <Center>
      <Loader variant="bars" />
    </Center>
  </>
) : (
  posts && posts.length > 0 ? (
    posts.map((post) => (
      <Post post={post} username={currentUser.ProfileEntryResponse?.Username} key={post.PostHashHex} />
    ))
  ) : (
    // If no NFTs, show the Badge
    <>
      <Space h="md"/>
      <Center>
        <Badge
          size="md"
          radius="sm"
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan", deg: 45 }}
        >
          Post something to view them here!
        </Badge>
      </Center>
    </>
  )
)}


          
                   <Space h={222} />
            </Tabs.Panel>

            <Tabs.Panel value="second">
            {isLoadingNFTs ? (
  <>
    <Space h="md"/>
    <Center>
      <Loader variant="bars" />
    </Center>
  </>
) : (
  // After loading, check if there are NFTs to display
  NFTs && Object.keys(NFTs).length > 0 ? (
    Object.keys(NFTs).map((key, index) => {
      const nft = NFTs[key];
      return (
        <Post post={nft.PostEntryResponse} username={nft.PostEntryResponse.ProfileEntryResponse.Username} key={nft.PostEntryResponse.PostHashHex}/>
      );
    })
  ) : (
    // If no NFTs, show the Badge
    <>
      <Space h="md"/>
      <Center>
        <Badge
          size="md"
          radius="sm"
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan", deg: 45 }}
        >
          Mint something to view them here!
        </Badge>
      </Center>
    </>
  )
)}


           

              
            </Tabs.Panel>
          </Tabs>
          <Space h={222} />
        </>
      ) : (
        <>
          <Container size="30rem" px={0}>
            <Paper shadow="xl" p="lg" withBorder>
              <Center>
                <Text c="dimmed" fw={700}>
                  Please Sign Up or Sign In to view your Profile.
                </Text>
              </Center>
              <Space h="md" />
              <Center>
                <Button
                  fullWidth
                  leftIcon={<GiWaveCrest size="1rem" />}
                  variant="gradient"
                  gradient={{ from: "cyan", to: "indigo" }}
                  onClick={() => identity.login()}
                >
                  Sign Up
                </Button>
                <Space w="xs" />
                <Button
                  fullWidth
                  variant="default"
                  onClick={() => identity.login()}
                >
                  Sign In
                </Button>
              </Center>
            </Paper>
          </Container>
        </>
      )}
    </>
  );
};